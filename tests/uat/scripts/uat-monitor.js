/**
 * UAT Monitoring and Reporting Tool
 * Monitors UAT execution, collects metrics, and generates reports
 */

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

class UATMonitor {
  constructor() {
    this.startTime = new Date();
    this.metrics = {
      sessions: [],
      tasks: [],
      bugs: [],
      feedback: [],
      performance: []
    };
    this.reportPath = path.join(__dirname, '../reports');
  }

  async initialize() {
    // Ensure reports directory exists
    try {
      await fs.mkdir(this.reportPath, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
    
    console.log('🔍 UAT Monitor initialized');
    console.log(`📊 Reports will be saved to: ${this.reportPath}`);
  }

  // Session Management
  async startSession(sessionData) {
    const session = {
      id: this.generateSessionId(),
      startTime: new Date(),
      endTime: null,
      participant: sessionData.participant,
      role: sessionData.role,
      device: sessionData.device,
      browser: sessionData.browser,
      scenarios: [],
      status: 'active'
    };

    this.metrics.sessions.push(session);
    await this.saveSessionData(session);
    
    console.log(`🎯 Started UAT session: ${session.id} for ${session.participant.name}`);
    return session.id;
  }

  async endSession(sessionId, feedback = {}) {
    const session = this.metrics.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.endTime = new Date();
    session.duration = session.endTime - session.startTime;
    session.status = 'completed';
    session.overallFeedback = feedback;

    await this.saveSessionData(session);
    console.log(`✅ Completed UAT session: ${sessionId} (${Math.round(session.duration / 1000 / 60)} minutes)`);
    
    return session;
  }

  // Task Tracking
  async startTask(sessionId, taskData) {
    const task = {
      id: this.generateTaskId(),
      sessionId: sessionId,
      name: taskData.name,
      scenario: taskData.scenario,
      startTime: new Date(),
      endTime: null,
      status: 'in_progress',
      errors: [],
      feedback: {},
      metrics: {
        clicks: 0,
        pageViews: 0,
        formSubmissions: 0,
        errorCount: 0
      }
    };

    this.metrics.tasks.push(task);
    console.log(`📋 Started task: ${task.name} (${task.id})`);
    
    return task.id;
  }

  async completeTask(taskId, result) {
    const task = this.metrics.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.endTime = new Date();
    task.duration = task.endTime - task.startTime;
    task.status = result.success ? 'completed' : 'failed';
    task.completionRate = result.completionRate || (result.success ? 100 : 0);
    task.feedback = result.feedback || {};
    task.errors = result.errors || [];

    await this.saveTaskData(task);
    console.log(`${result.success ? '✅' : '❌'} Task ${task.name}: ${task.status} (${Math.round(task.duration / 1000)}s)`);
    
    return task;
  }

  // Bug Reporting
  async reportBug(bugData) {
    const bug = {
      id: this.generateBugId(),
      timestamp: new Date(),
      sessionId: bugData.sessionId,
      taskId: bugData.taskId,
      severity: bugData.severity,
      title: bugData.title,
      description: bugData.description,
      steps: bugData.steps || [],
      expected: bugData.expected,
      actual: bugData.actual,
      browser: bugData.browser,
      device: bugData.device,
      screenshot: bugData.screenshot,
      status: 'open',
      assignee: null,
      resolution: null
    };

    this.metrics.bugs.push(bug);
    await this.saveBugReport(bug);
    
    console.log(`🐛 Bug reported: ${bug.title} (${bug.severity})`);
    return bug.id;
  }

  // Performance Monitoring
  async recordPerformanceMetric(metric) {
    const perfMetric = {
      timestamp: new Date(),
      sessionId: metric.sessionId,
      taskId: metric.taskId,
      type: metric.type, // 'page_load', 'api_response', 'user_action'
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      context: metric.context || {}
    };

    this.metrics.performance.push(perfMetric);
    
    if (perfMetric.value > this.getPerformanceThreshold(perfMetric.type)) {
      console.log(`⚠️  Performance issue: ${perfMetric.name} took ${perfMetric.value}${perfMetric.unit}`);
    }
  }

  // Feedback Collection
  async collectFeedback(feedbackData) {
    const feedback = {
      id: this.generateFeedbackId(),
      timestamp: new Date(),
      sessionId: feedbackData.sessionId,
      taskId: feedbackData.taskId,
      type: feedbackData.type, // 'sus', 'task_specific', 'interview', 'focus_group'
      ratings: feedbackData.ratings || {},
      comments: feedbackData.comments || '',
      suggestions: feedbackData.suggestions || [],
      participant: feedbackData.participant
    };

    this.metrics.feedback.push(feedback);
    await this.saveFeedbackData(feedback);
    
    console.log(`💬 Feedback collected: ${feedback.type} from ${feedback.participant.name}`);
    return feedback.id;
  }

  // Report Generation
  async generateDailyReport(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const dailyData = this.filterDataByDateRange(dayStart, dayEnd);
    
    const report = {
      date: dateStr,
      summary: this.generateSummaryStats(dailyData),
      sessions: this.generateSessionReport(dailyData.sessions),
      tasks: this.generateTaskReport(dailyData.tasks),
      bugs: this.generateBugReport(dailyData.bugs),
      performance: this.generatePerformanceReport(dailyData.performance),
      feedback: this.generateFeedbackReport(dailyData.feedback),
      recommendations: this.generateRecommendations(dailyData)
    };

    const reportFile = path.join(this.reportPath, `daily-report-${dateStr}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    await this.generateHTMLReport(report, `daily-report-${dateStr}.html`);
    
    console.log(`📊 Daily report generated: ${reportFile}`);
    return report;
  }

  async generateWeeklyReport() {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyData = this.filterDataByDateRange(startDate, endDate);
    
    const report = {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary: this.generateSummaryStats(weeklyData),
      trends: this.generateTrendAnalysis(weeklyData),
      userSegments: this.generateUserSegmentAnalysis(weeklyData),
      criticalIssues: this.identifyCriticalIssues(weeklyData),
      recommendations: this.generateWeeklyRecommendations(weeklyData)
    };

    const reportFile = path.join(this.reportPath, `weekly-report-${endDate.toISOString().split('T')[0]}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    await this.generateHTMLReport(report, `weekly-report-${endDate.toISOString().split('T')[0]}.html`);
    
    console.log(`📈 Weekly report generated: ${reportFile}`);
    return report;
  }

  async generateFinalReport() {
    const allData = {
      sessions: this.metrics.sessions,
      tasks: this.metrics.tasks,
      bugs: this.metrics.bugs,
      performance: this.metrics.performance,
      feedback: this.metrics.feedback
    };

    const report = {
      executionPeriod: {
        start: this.startTime,
        end: new Date(),
        duration: new Date() - this.startTime
      },
      executiveSummary: this.generateExecutiveSummary(allData),
      detailedFindings: this.generateDetailedFindings(allData),
      usabilityAnalysis: this.generateUsabilityAnalysis(allData),
      performanceAnalysis: this.generatePerformanceAnalysis(allData),
      bugAnalysis: this.generateBugAnalysis(allData),
      userFeedbackAnalysis: this.generateUserFeedbackAnalysis(allData),
      recommendations: this.generateFinalRecommendations(allData),
      readinessAssessment: this.generateReadinessAssessment(allData)
    };

    const reportFile = path.join(this.reportPath, 'final-uat-report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    await this.generateHTMLReport(report, 'final-uat-report.html');
    await this.generateExecutivePresentation(report);
    
    console.log(`🎯 Final UAT report generated: ${reportFile}`);
    return report;
  }

  // Helper Methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBugId() {
    return `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFeedbackId() {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getPerformanceThreshold(type) {
    const thresholds = {
      'page_load': 3000, // 3 seconds
      'api_response': 1000, // 1 second
      'user_action': 500 // 500ms
    };
    return thresholds[type] || 1000;
  }

  filterDataByDateRange(startDate, endDate) {
    return {
      sessions: this.metrics.sessions.filter(s => 
        s.startTime >= startDate && s.startTime <= endDate
      ),
      tasks: this.metrics.tasks.filter(t => 
        t.startTime >= startDate && t.startTime <= endDate
      ),
      bugs: this.metrics.bugs.filter(b => 
        b.timestamp >= startDate && b.timestamp <= endDate
      ),
      performance: this.metrics.performance.filter(p => 
        p.timestamp >= startDate && p.timestamp <= endDate
      ),
      feedback: this.metrics.feedback.filter(f => 
        f.timestamp >= startDate && f.timestamp <= endDate
      )
    };
  }

  generateSummaryStats(data) {
    return {
      totalSessions: data.sessions.length,
      completedSessions: data.sessions.filter(s => s.status === 'completed').length,
      totalTasks: data.tasks.length,
      completedTasks: data.tasks.filter(t => t.status === 'completed').length,
      taskCompletionRate: data.tasks.length > 0 ? 
        (data.tasks.filter(t => t.status === 'completed').length / data.tasks.length * 100).toFixed(1) : 0,
      totalBugs: data.bugs.length,
      criticalBugs: data.bugs.filter(b => b.severity === 'critical').length,
      averageTaskDuration: this.calculateAverageTaskDuration(data.tasks),
      averageSUSScore: this.calculateAverageSUSScore(data.feedback)
    };
  }

  calculateAverageTaskDuration(tasks) {
    const completedTasks = tasks.filter(t => t.duration);
    if (completedTasks.length === 0) return 0;
    
    const totalDuration = completedTasks.reduce((sum, task) => sum + task.duration, 0);
    return Math.round(totalDuration / completedTasks.length / 1000); // Convert to seconds
  }

  calculateAverageSUSScore(feedback) {
    const susScores = feedback
      .filter(f => f.type === 'sus' && f.ratings.susScore)
      .map(f => f.ratings.susScore);
    
    if (susScores.length === 0) return null;
    
    return (susScores.reduce((sum, score) => sum + score, 0) / susScores.length).toFixed(1);
  }

  generateExecutiveSummary(data) {
    const stats = this.generateSummaryStats(data);
    const criticalIssues = this.identifyCriticalIssues(data);
    
    return {
      overallAssessment: this.determineOverallAssessment(stats, criticalIssues),
      keyMetrics: stats,
      criticalFindings: criticalIssues.slice(0, 5), // Top 5 critical issues
      readinessRecommendation: this.generateReadinessRecommendation(stats, criticalIssues),
      nextSteps: this.generateNextSteps(stats, criticalIssues)
    };
  }

  determineOverallAssessment(stats, criticalIssues) {
    const completionRate = parseFloat(stats.taskCompletionRate);
    const susScore = parseFloat(stats.averageSUSScore) || 0;
    const criticalBugCount = stats.criticalBugs;

    if (completionRate >= 95 && susScore >= 80 && criticalBugCount === 0) {
      return 'EXCELLENT - Ready for immediate deployment';
    } else if (completionRate >= 90 && susScore >= 70 && criticalBugCount <= 2) {
      return 'GOOD - Ready for deployment with minor fixes';
    } else if (completionRate >= 80 && susScore >= 60 && criticalBugCount <= 5) {
      return 'ACCEPTABLE - Requires fixes before deployment';
    } else {
      return 'NEEDS IMPROVEMENT - Significant issues require resolution';
    }
  }

  identifyCriticalIssues(data) {
    const issues = [];

    // Critical bugs
    data.bugs.filter(b => b.severity === 'critical').forEach(bug => {
      issues.push({
        type: 'critical_bug',
        severity: 'critical',
        title: bug.title,
        description: bug.description,
        impact: 'System unusable or data loss risk'
      });
    });

    // Low task completion rates
    const tasksByScenario = this.groupTasksByScenario(data.tasks);
    Object.entries(tasksByScenario).forEach(([scenario, tasks]) => {
      const completionRate = tasks.filter(t => t.status === 'completed').length / tasks.length * 100;
      if (completionRate < 80) {
        issues.push({
          type: 'low_completion_rate',
          severity: 'high',
          title: `Low completion rate for ${scenario}`,
          description: `Only ${completionRate.toFixed(1)}% of users completed ${scenario} successfully`,
          impact: 'Users unable to complete critical workflows'
        });
      }
    });

    // Performance issues
    const slowOperations = data.performance.filter(p => 
      p.value > this.getPerformanceThreshold(p.type) * 2
    );
    if (slowOperations.length > 0) {
      issues.push({
        type: 'performance_issue',
        severity: 'medium',
        title: 'Performance concerns identified',
        description: `${slowOperations.length} operations exceeded performance thresholds`,
        impact: 'Poor user experience and potential adoption barriers'
      });
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  groupTasksByScenario(tasks) {
    return tasks.reduce((groups, task) => {
      const scenario = task.scenario || 'unknown';
      if (!groups[scenario]) groups[scenario] = [];
      groups[scenario].push(task);
      return groups;
    }, {});
  }

  async generateHTMLReport(report, filename) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UAT Report - Patient Engagement Module</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #2196F3; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .critical { color: #f44336; }
        .warning { color: #ff9800; }
        .success { color: #4caf50; }
        .chart { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UAT Report - Patient Engagement & Follow-up Management</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        ${this.generateHTMLSummary(report)}
    </div>
    
    <div class="metrics">
        <h2>Key Metrics</h2>
        ${this.generateHTMLMetrics(report)}
    </div>
    
    <div class="findings">
        <h2>Detailed Findings</h2>
        ${this.generateHTMLFindings(report)}
    </div>
    
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${this.generateHTMLRecommendations(report)}
    </div>
</body>
</html>`;

    const reportFile = path.join(this.reportPath, filename);
    await fs.writeFile(reportFile, html);
    console.log(`📄 HTML report generated: ${reportFile}`);
  }

  generateHTMLSummary(report) {
    if (report.executiveSummary) {
      return `
        <p><strong>Overall Assessment:</strong> ${report.executiveSummary.overallAssessment}</p>
        <p><strong>Readiness Recommendation:</strong> ${report.executiveSummary.readinessRecommendation}</p>
      `;
    }
    return '<p>Summary data not available</p>';
  }

  generateHTMLMetrics(report) {
    const summary = report.summary || report.executiveSummary?.keyMetrics;
    if (!summary) return '<p>Metrics data not available</p>';

    return `
      <div class="metric">
        <h3>Sessions</h3>
        <p>${summary.completedSessions}/${summary.totalSessions} completed</p>
      </div>
      <div class="metric">
        <h3>Task Completion</h3>
        <p>${summary.taskCompletionRate}%</p>
      </div>
      <div class="metric">
        <h3>Bugs Found</h3>
        <p>${summary.totalBugs} total (${summary.criticalBugs} critical)</p>
      </div>
      <div class="metric">
        <h3>Average SUS Score</h3>
        <p>${summary.averageSUSScore || 'N/A'}</p>
      </div>
    `;
  }

  generateHTMLFindings(report) {
    // Implementation would generate detailed findings HTML
    return '<p>Detailed findings would be displayed here</p>';
  }

  generateHTMLRecommendations(report) {
    // Implementation would generate recommendations HTML
    return '<p>Recommendations would be displayed here</p>';
  }

  // Data persistence methods
  async saveSessionData(session) {
    const sessionFile = path.join(this.reportPath, 'sessions', `${session.id}.json`);
    await fs.mkdir(path.dirname(sessionFile), { recursive: true });
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
  }

  async saveTaskData(task) {
    const taskFile = path.join(this.reportPath, 'tasks', `${task.id}.json`);
    await fs.mkdir(path.dirname(taskFile), { recursive: true });
    await fs.writeFile(taskFile, JSON.stringify(task, null, 2));
  }

  async saveBugReport(bug) {
    const bugFile = path.join(this.reportPath, 'bugs', `${bug.id}.json`);
    await fs.mkdir(path.dirname(bugFile), { recursive: true });
    await fs.writeFile(bugFile, JSON.stringify(bug, null, 2));
  }

  async saveFeedbackData(feedback) {
    const feedbackFile = path.join(this.reportPath, 'feedback', `${feedback.id}.json`);
    await fs.mkdir(path.dirname(feedbackFile), { recursive: true });
    await fs.writeFile(feedbackFile, JSON.stringify(feedback, null, 2));
  }
}

module.exports = UATMonitor;