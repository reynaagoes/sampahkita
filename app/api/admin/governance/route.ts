import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getAppSession, getSessionRole } from "@/lib/auth-session"
import { REWARDS } from "@/lib/points"

const PICKUP_STATUSES = ["OPEN", "ASSIGNED", "ON_THE_WAY", "ARRIVED", "WEIGHED", "COMPLETED", "CANCELLED"] as const
const BATCH_STATUSES = ["AVAILABLE", "OFFER_SUBMITTED", "COUNTER_OFFERED", "APPROVED", "REJECTED", "IN_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED"] as const

function ensureAdmin(session: Awaited<ReturnType<typeof getAppSession>>) {
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (getSessionRole(session.user.role) !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET() {
  try {
    const session = await getAppSession()
    const authError = ensureAdmin(session)
    if (authError) return authError

    const [
      [userCounts],
      [verificationRows],
      [pointSummaryRows],
      [householdPointRows],
      [rewardSummaryRows],
      [rewardTotalsRows],
      [pickupCountRows],
      [recentPickupRows],
      [batchCountRows],
      [recentBatchRows],
      [batchFinanceRows],
    ] = await Promise.all([
      pool.execute(
        `SELECT
           COUNT(*) AS users,
           SUM(CASE WHEN role IN ('COLLECTOR', 'RECYCLER') AND isVerified = false THEN 1 ELSE 0 END) AS pending,
           (SELECT COUNT(*) FROM sampah_requests) + (SELECT COUNT(*) FROM material_batches) AS transactions
         FROM users`
      ) as any,
      pool.execute(
        `SELECT
           u.id,
           u.fullName,
           u.email,
           u.role,
           u.phone,
           u.address,
           u.isVerified,
           COALESCE(cv.status, 'PENDING') AS verificationStatus,
           cv.notes AS verificationNotes,
           u.createdAt
         FROM users u
         LEFT JOIN collector_verifications cv ON cv.collectorId = u.id
         WHERE u.role IN ('COLLECTOR', 'RECYCLER') AND u.isVerified = false
         ORDER BY COALESCE(cv.updatedAt, u.createdAt) DESC, u.createdAt DESC`
      ) as any,
      pool.execute(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'EARNED' THEN amount ELSE -amount END), 0) AS totalCirculating,
           COALESCE(SUM(CASE
             WHEN DATE(createdAt) = CURDATE() AND type = 'EARNED' THEN amount
             WHEN DATE(createdAt) = CURDATE() AND type = 'REDEEMED' THEN -amount
             ELSE 0
           END), 0) AS todayNet,
           COALESCE(SUM(CASE
             WHEN YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE()) AND type = 'EARNED' THEN amount
             WHEN YEAR(createdAt) = YEAR(CURDATE()) AND MONTH(createdAt) = MONTH(CURDATE()) AND type = 'REDEEMED' THEN -amount
             ELSE 0
           END), 0) AS monthNet
         FROM points_ledger`
      ) as any,
      pool.execute(
        `SELECT
           u.id,
           u.fullName,
           u.email,
           COALESCE(SUM(CASE WHEN pl.type = 'EARNED' THEN pl.amount ELSE -pl.amount END), 0) AS totalPoints
         FROM users u
         LEFT JOIN points_ledger pl ON pl.userId = u.id
         WHERE u.role = 'HOUSEHOLD'
         GROUP BY u.id, u.fullName, u.email
         ORDER BY totalPoints DESC, u.fullName ASC`
      ) as any,
      pool.execute(
        `SELECT
           rewardCode,
           rewardName,
           pointsCost,
           COUNT(*) AS totalRedeemed,
           SUM(CASE WHEN UPPER(status) = 'PENDING' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN UPPER(status) = 'CLAIMED' THEN 1 ELSE 0 END) AS claimed,
           SUM(CASE WHEN UPPER(status) IN ('CANCELLED', 'EXPIRED') THEN 1 ELSE 0 END) AS cancelledOrExpired
         FROM reward_redemptions
         GROUP BY rewardCode, rewardName, pointsCost`
      ) as any,
      pool.execute(
        `SELECT
           COUNT(*) AS totalRedeemed,
           SUM(CASE WHEN UPPER(status) = 'PENDING' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN UPPER(status) = 'CLAIMED' THEN 1 ELSE 0 END) AS claimed,
           SUM(CASE WHEN UPPER(status) IN ('CANCELLED', 'EXPIRED') THEN 1 ELSE 0 END) AS cancelledOrExpired
         FROM reward_redemptions`
      ) as any,
      pool.execute(
        `SELECT status, COUNT(*) AS count
         FROM sampah_requests
         GROUP BY status`
      ) as any,
      pool.execute(
        `SELECT
           sr.id,
           sr.status,
           sr.sampahTypes,
           sr.actualWeight,
           sr.estimatedWeight,
           sr.addressDetail,
           sr.createdAt,
           u.fullName AS householdName,
           c.fullName AS collectorName
         FROM sampah_requests sr
         JOIN users u ON u.id = sr.householdId
         LEFT JOIN users c ON c.id = sr.collectorId
         ORDER BY sr.createdAt DESC
         LIMIT 8`
      ) as any,
      pool.execute(
        `SELECT
           CASE WHEN status = 'PURCHASE_REQUESTED' THEN 'OFFER_SUBMITTED' ELSE status END AS status,
           COUNT(*) AS count
         FROM material_batches
         GROUP BY CASE WHEN status = 'PURCHASE_REQUESTED' THEN 'OFFER_SUBMITTED' ELSE status END`
      ) as any,
      pool.execute(
        `SELECT
           mb.id,
           CASE WHEN mb.status = 'PURCHASE_REQUESTED' THEN 'OFFER_SUBMITTED' ELSE mb.status END AS status,
           mb.wasteType,
           mb.totalWeight,
           mb.agreedPrice,
           mb.platformFee,
           mb.collectorEarning,
           mb.createdAt,
           mb.updatedAt,
           u.fullName AS collectorName,
           r.fullName AS recyclerName
         FROM material_batches mb
         JOIN users u ON u.id = mb.collectorId
         LEFT JOIN users r ON r.id = mb.recyclerId
         ORDER BY mb.updatedAt DESC
         LIMIT 8`
      ) as any,
      pool.execute(
        `SELECT
           COALESCE(SUM(CASE WHEN agreedPrice IS NOT NULL AND agreedPrice > 0 THEN agreedPrice ELSE 0 END), 0) AS totalBatchValue,
           COALESCE(SUM(CASE
             WHEN agreedPrice IS NOT NULL AND agreedPrice > 0 THEN COALESCE(platformFee, ROUND(agreedPrice * 0.05))
             ELSE 0
           END), 0) AS totalPlatformFee,
           COALESCE(SUM(CASE
             WHEN agreedPrice IS NOT NULL AND agreedPrice > 0 THEN COALESCE(collectorEarning, agreedPrice - COALESCE(platformFee, ROUND(agreedPrice * 0.05)))
             ELSE 0
           END), 0) AS totalCollectorEarning,
           SUM(CASE WHEN agreedPrice IS NOT NULL AND agreedPrice > 0 THEN 1 ELSE 0 END) AS batchesWithFinance
         FROM material_batches`
      ) as any,
    ])

    const pickupCounts = Object.fromEntries(PICKUP_STATUSES.map((status) => [status, 0]))
    for (const row of pickupCountRows as Array<{ status: string; count: number | string }>) {
      pickupCounts[String(row.status).toUpperCase()] = Number(row.count || 0)
    }

    const batchCounts = Object.fromEntries(BATCH_STATUSES.map((status) => [status, 0]))
    for (const row of batchCountRows as Array<{ status: string; count: number | string }>) {
      batchCounts[String(row.status).toUpperCase()] = Number(row.count || 0)
    }

    const rewardSummaryMap = new Map(
      (rewardSummaryRows as Array<{ rewardCode: string; rewardName: string; pointsCost: number | string; totalRedeemed: number | string; pending: number | string; claimed: number | string; cancelledOrExpired: number | string }>).map((row) => [
        row.rewardCode,
        {
          rewardCode: row.rewardCode,
          rewardName: row.rewardName,
          pointsCost: Number(row.pointsCost || 0),
          totalRedeemed: Number(row.totalRedeemed || 0),
          pending: Number(row.pending || 0),
          claimed: Number(row.claimed || 0),
          cancelledOrExpired: Number(row.cancelledOrExpired || 0),
        },
      ])
    )

    const rewardCatalog = REWARDS.map((reward) => {
      const summary = rewardSummaryMap.get(reward.code)
      return {
        rewardCode: reward.code,
        rewardName: reward.name,
        pointsCost: reward.points,
        totalRedeemed: summary?.totalRedeemed || 0,
        pending: summary?.pending || 0,
        claimed: summary?.claimed || 0,
        cancelledOrExpired: summary?.cancelledOrExpired || 0,
      }
    })

    return NextResponse.json({
      stats: {
        users: Number(userCounts[0]?.users || 0),
        pending: Number(userCounts[0]?.pending || 0),
        transactions: Number(userCounts[0]?.transactions || 0),
        totalPoints: Number(pointSummaryRows[0]?.totalCirculating || 0),
      },
      verifications: (verificationRows as Array<Record<string, unknown>>).map((row) => ({
        ...row,
        verificationStatus: String(row.verificationStatus || "PENDING").toUpperCase(),
        isVerified: Boolean(row.isVerified),
      })),
      points: {
        totalCirculating: Number(pointSummaryRows[0]?.totalCirculating || 0),
        todayNet: Number(pointSummaryRows[0]?.todayNet || 0),
        monthNet: Number(pointSummaryRows[0]?.monthNet || 0),
        households: (householdPointRows as Array<Record<string, unknown>>).map((row) => ({
          ...row,
          totalPoints: Number(row.totalPoints || 0),
        })),
      },
      rewards: {
        empty: Number(rewardTotalsRows[0]?.totalRedeemed || 0) === 0,
        totals: {
          totalRedeemed: Number(rewardTotalsRows[0]?.totalRedeemed || 0),
          pending: Number(rewardTotalsRows[0]?.pending || 0),
          claimed: Number(rewardTotalsRows[0]?.claimed || 0),
          cancelledOrExpired: Number(rewardTotalsRows[0]?.cancelledOrExpired || 0),
        },
        catalog: rewardCatalog,
      },
      transactions: {
        pickups: {
          counts: pickupCounts,
          recent: recentPickupRows,
        },
        batches: {
          counts: batchCounts,
          recent: (recentBatchRows as Array<Record<string, unknown>>).map((row) => ({
            ...row,
            agreedPrice: Number(row.agreedPrice || 0),
            platformFee: Number(row.platformFee || 0),
            collectorEarning: Number(row.collectorEarning || 0),
          })),
        },
        finance: {
          totalBatchValue: Number(batchFinanceRows[0]?.totalBatchValue || 0),
          totalPlatformFee: Number(batchFinanceRows[0]?.totalPlatformFee || 0),
          totalCollectorEarning: Number(batchFinanceRows[0]?.totalCollectorEarning || 0),
          batchesWithFinance: Number(batchFinanceRows[0]?.batchesWithFinance || 0),
        },
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        stats: { users: 0, pending: 0, transactions: 0, totalPoints: 0 },
        verifications: [],
        points: { totalCirculating: 0, todayNet: 0, monthNet: 0, households: [] },
        rewards: {
          empty: true,
          totals: { totalRedeemed: 0, pending: 0, claimed: 0, cancelledOrExpired: 0 },
          catalog: REWARDS.map((reward) => ({
            rewardCode: reward.code,
            rewardName: reward.name,
            pointsCost: reward.points,
            totalRedeemed: 0,
            pending: 0,
            claimed: 0,
            cancelledOrExpired: 0,
          })),
        },
        transactions: {
          pickups: { counts: Object.fromEntries(PICKUP_STATUSES.map((status) => [status, 0])), recent: [] },
          batches: { counts: Object.fromEntries(BATCH_STATUSES.map((status) => [status, 0])), recent: [] },
          finance: { totalBatchValue: 0, totalPlatformFee: 0, totalCollectorEarning: 0, batchesWithFinance: 0 },
        },
      },
      { status: 200 }
    )
  }
}
