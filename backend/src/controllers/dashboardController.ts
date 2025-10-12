import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { User } from '../models/User';
import { Workplace } from '../models/Workplace';
import Patient from '../models/Patient';
import ClinicalNote from '../models/ClinicalNote';
import { IMedicationTherapyReview } from '../models/MedicationTherapyReview';
import MedicationRecord from '../models/MedicationRecord';
import mongoose from 'mongoose';

// Get MTR model
const MedicationTherapyReview = mongoose.model<IMedicationTherapyReview>('MedicationTherapyReview');

export class DashboardController {
    /**
     * Get optimized dashboard overview with aggregated data
     * This method combines all dashboard data in a single optimized query
     */
    async getDashboardOverview(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user!;
            const workplaceId = user.workplaceId;

            if (!workplaceId) {
                res.status(400).json({
                    success: false,
                    message: 'No workplace associated with user',
                    error: 'WORKPLACE_NOT_FOUND'
                });
                return;
            }

            console.log(`🚀 Fetching dashboard overview for workplace: ${workplaceId}`);

            // Execute all database queries in parallel for better performance
            const [
                stats,
                workspaceInfo,
                chartData,
                recentActivities
            ] = await Promise.allSettled([
                this.getAggregatedStats(workplaceId),
                this.getWorkspaceDetails(workplaceId),
                this.getBasicChartData(workplaceId),
                this.getRecentActivities(workplaceId, user._id)
            ]);

            // Handle results safely
            const dashboardData = {
                stats: stats.status === 'fulfilled' ? stats.value : this.getDefaultStats(),
                workspace: workspaceInfo.status === 'fulfilled' ? workspaceInfo.value : null,
                charts: chartData.status === 'fulfilled' ? chartData.value : this.getDefaultChartData(),
                activities: recentActivities.status === 'fulfilled' ? recentActivities.value : []
            };

            // Log any failures for debugging
            if (stats.status === 'rejected') console.error('Stats query failed:', stats.reason);
            if (workspaceInfo.status === 'rejected') console.error('Workspace query failed:', workspaceInfo.reason);
            if (chartData.status === 'rejected') console.error('Chart data query failed:', chartData.reason);
            if (recentActivities.status === 'rejected') console.error('Activities query failed:', recentActivities.reason);

            console.log(`✅ Dashboard overview loaded successfully for workplace: ${workplaceId}`);

            res.json({
                success: true,
                message: 'Dashboard overview retrieved successfully',
                data: dashboardData,
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('❌ Error fetching dashboard overview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load dashboard overview',
                error: error.message
            });
        }
    }

    /**
     * Get dashboard statistics only
     */
    async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user!;
            const workplaceId = user.workplaceId;

            if (!workplaceId) {
                res.status(400).json({
                    success: false,
                    message: 'No workplace associated with user'
                });
                return;
            }

            const stats = await this.getAggregatedStats(workplaceId);

            res.json({
                success: true,
                message: 'Dashboard statistics retrieved successfully',
                data: { stats },
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('❌ Error fetching dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load dashboard statistics',
                error: error.message
            });
        }
    }

    /**
     * Get chart data for dashboard
     */
    async getChartData(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user!;
            const workplaceId = user.workplaceId;

            if (!workplaceId) {
                res.status(400).json({
                    success: false,
                    message: 'No workplace associated with user'
                });
                return;
            }

            const chartData = await this.getDetailedChartData(workplaceId);

            res.json({
                success: true,
                message: 'Chart data retrieved successfully',
                data: chartData,
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('❌ Error fetching chart data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load chart data',
                error: error.message
            });
        }
    }

    /**
     * Get workspace information for dashboard
     */
    async getWorkspaceInfo(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = req.user!;
            const workplaceId = user.workplaceId;

            if (!workplaceId) {
                res.status(400).json({
                    success: false,
                    message: 'No workplace associated with user'
                });
                return;
            }

            const workspaceInfo = await this.getWorkspaceDetails(workplaceId);

            res.json({
                success: true,
                message: 'Workspace information retrieved successfully',
                data: workspaceInfo,
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('❌ Error fetching workspace info:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load workspace information',
                error: error.message
            });
        }
    }

    /**
     * Get aggregated statistics using optimized MongoDB aggregation
     */
    private async getAggregatedStats(workplaceId: any) {
        console.log(`📊 Getting aggregated stats for workplace: ${workplaceId}`);

        // Use Promise.allSettled to prevent one failing query from breaking others
        const [patientsCount, notesCount, medicationsCount, mtrCount] = await Promise.allSettled([
            Patient.countDocuments({
                workplaceId,
                isDeleted: { $ne: true }
            }),
            ClinicalNote.countDocuments({
                workplaceId
            }),
            MedicationRecord.countDocuments({
                workplaceId
            }),
            MedicationTherapyReview.countDocuments({
                workplaceId
            })
        ]);

        return {
            totalPatients: patientsCount.status === 'fulfilled' ? patientsCount.value : 0,
            totalClinicalNotes: notesCount.status === 'fulfilled' ? notesCount.value : 0,
            totalMedications: medicationsCount.status === 'fulfilled' ? medicationsCount.value : 0,
            totalMTRs: mtrCount.status === 'fulfilled' ? mtrCount.value : 0,
            totalDiagnostics: 0 // Will be implemented when diagnostics are available
        };
    }

    /**
     * Get workspace details with team information
     */
    private async getWorkspaceDetails(workplaceId: any) {
        console.log(`🏢 Getting workspace details for: ${workplaceId}`);

        const [workplace, teamMembers] = await Promise.allSettled([
            Workplace.findById(workplaceId)
                .populate('ownerId', 'firstName lastName email workplaceRole')
                .lean(),
            User.find({
                workplaceId,
                status: 'active'
            })
                .select('firstName lastName email workplaceRole lastLoginAt')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
        ]);

        const workplaceData = workplace.status === 'fulfilled' ? workplace.value : null;
        const membersData = teamMembers.status === 'fulfilled' ? teamMembers.value : [];

        return {
            workplace: workplaceData,
            teamMembers: membersData,
            memberCount: membersData.length
        };
    }

    /**
     * Get basic chart data optimized for quick loading
     */
    private async getBasicChartData(workplaceId: any) {
        console.log(`📈 Getting basic chart data for workplace: ${workplaceId}`);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Get basic aggregations for charts
        const [patientsOverTime, notesOverTime] = await Promise.allSettled([
            Patient.aggregate([
                {
                    $match: {
                        workplaceId,
                        createdAt: { $gte: sixMonthsAgo },
                        isDeleted: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $limit: 6 }
            ]),
            ClinicalNote.aggregate([
                {
                    $match: {
                        workplaceId,
                        createdAt: { $gte: sixMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        return {
            patientsOverTime: patientsOverTime.status === 'fulfilled' ? patientsOverTime.value : [],
            notesOverTime: notesOverTime.status === 'fulfilled' ? notesOverTime.value : []
        };
    }

    /**
     * Get detailed chart data (loaded separately for better performance)
     */
    private async getDetailedChartData(workplaceId: any) {
        // This can be loaded separately to avoid blocking the main dashboard
        console.log(`📊 Getting detailed chart data for workplace: ${workplaceId}`);

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const [medicationsByStatus, mtrsByStatus, patientAgeDistribution] = await Promise.allSettled([
            MedicationRecord.aggregate([
                { $match: { workplaceId } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            MedicationTherapyReview.aggregate([
                { $match: { workplaceId } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Patient.aggregate([
                {
                    $match: {
                        workplaceId,
                        isDeleted: { $ne: true },
                        dateOfBirth: { $exists: true }
                    }
                },
                {
                    $addFields: {
                        age: {
                            $floor: {
                                $divide: [
                                    { $subtract: [new Date(), '$dateOfBirth'] },
                                    365.25 * 24 * 60 * 60 * 1000
                                ]
                            }
                        }
                    }
                },
                {
                    $bucket: {
                        groupBy: '$age',
                        boundaries: [0, 18, 35, 50, 65, 100],
                        default: 'Unknown',
                        output: { count: { $sum: 1 } }
                    }
                }
            ])
        ]);

        return {
            medicationsByStatus: medicationsByStatus.status === 'fulfilled' ? medicationsByStatus.value : [],
            mtrsByStatus: mtrsByStatus.status === 'fulfilled' ? mtrsByStatus.value : [],
            patientAgeDistribution: patientAgeDistribution.status === 'fulfilled' ? patientAgeDistribution.value : []
        };
    }

    /**
     * Get recent activities for dashboard
     */
    private async getRecentActivities(workplaceId: any, userId: any) {
        console.log(`📝 Getting recent activities for workplace: ${workplaceId}`);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Get recent activities across different modules
        const [recentPatients, recentNotes, recentMTRs] = await Promise.allSettled([
            Patient.find({
                workplaceId,
                createdAt: { $gte: oneWeekAgo },
                isDeleted: { $ne: true }
            })
                .select('firstName lastName createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            ClinicalNote.find({
                workplaceId,
                createdAt: { $gte: oneWeekAgo }
            })
                .populate('patient', 'firstName lastName')
                .select('type createdAt patient')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            MedicationTherapyReview.find({
                workplaceId,
                createdAt: { $gte: oneWeekAgo }
            })
                .populate('patientId', 'firstName lastName')
                .select('status createdAt patientId')
                .sort({ createdAt: -1 })
                .limit(3)
                .lean()
        ]);

        const activities = [];

        if (recentPatients.status === 'fulfilled') {
            recentPatients.value.forEach(patient => {
                activities.push({
                    type: 'patient_added',
                    description: `New patient: ${patient.firstName} ${patient.lastName}`,
                    timestamp: patient.createdAt
                });
            });
        }

        if (recentNotes.status === 'fulfilled') {
            recentNotes.value.forEach((note: any) => {
                activities.push({
                    type: 'note_created',
                    description: `${note.type} note created for ${(note.patient as any)?.firstName} ${(note.patient as any)?.lastName}`,
                    timestamp: note.createdAt
                });
            });
        }

        if (recentMTRs.status === 'fulfilled') {
            recentMTRs.value.forEach((mtr: any) => {
                activities.push({
                    type: 'mtr_created',
                    description: `MTR session created for ${(mtr.patientId as any)?.firstName} ${(mtr.patientId as any)?.lastName}`,
                    timestamp: mtr.createdAt
                });
            });
        }

        // Sort by timestamp and return latest 10
        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }

    /**
     * Default stats when queries fail
     */
    private getDefaultStats() {
        return {
            totalPatients: 0,
            totalClinicalNotes: 0,
            totalMedications: 0,
            totalMTRs: 0,
            totalDiagnostics: 0
        };
    }

    /**
     * Default chart data when queries fail
     */
    private getDefaultChartData() {
        return {
            patientsOverTime: [],
            notesOverTime: []
        };
    }
}

export const dashboardController = new DashboardController();