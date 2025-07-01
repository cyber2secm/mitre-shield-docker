const cron = require('node-cron');
const MitreSyncService = require('./mitreSync');

class SchedulerService {
  constructor() {
    this.mitreSyncService = new MitreSyncService();
    this.jobs = new Map();
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('🕐 Starting scheduler service...');
    
    // Schedule MITRE sync to run daily at 2 AM
    this.scheduleJob('mitre-daily-sync', '0 2 * * *', async () => {
      console.log('⏰ Running scheduled MITRE sync...');
      try {
        const result = await this.mitreSyncService.syncMitreData();
        if (result.success) {
          console.log(`✅ Scheduled MITRE sync completed: ${result.message}`);
        } else {
          console.error(`❌ Scheduled MITRE sync failed: ${result.message}`);
        }
      } catch (error) {
        console.error('❌ Scheduled MITRE sync error:', error.message);
      }
    });

    // Schedule a weekly full sync on Sundays at 3 AM (with force=true)
    this.scheduleJob('mitre-weekly-full-sync', '0 3 * * 0', async () => {
      console.log('⏰ Running scheduled full MITRE sync...');
      try {
        const result = await this.mitreSyncService.syncMitreData(true);
        if (result.success) {
          console.log(`✅ Scheduled full MITRE sync completed: ${result.message}`);
        } else {
          console.error(`❌ Scheduled full MITRE sync failed: ${result.message}`);
        }
      } catch (error) {
        console.error('❌ Scheduled full MITRE sync error:', error.message);
      }
    });

    console.log('✅ Scheduler service started with the following jobs:');
    this.jobs.forEach((job, name) => {
      console.log(`  - ${name}: ${job.options ? job.options.scheduled : 'Unknown schedule'}`);
    });
  }

  /**
   * Schedule a new job
   */
  scheduleJob(name, cronExpression, task) {
    try {
      const job = cron.schedule(cronExpression, task, {
        scheduled: false,
        timezone: 'UTC'
      });
      
      job.start();
      this.jobs.set(name, job);
      
      console.log(`📅 Scheduled job '${name}' with expression: ${cronExpression}`);
      return job;
    } catch (error) {
      console.error(`❌ Failed to schedule job '${name}':`, error.message);
      return null;
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`⏹️ Stopped job: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    console.log('⏹️ Stopping all scheduled jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`  - Stopped: ${name}`);
    });
    this.jobs.clear();
    console.log('✅ All scheduled jobs stopped');
  }

  /**
   * Get status of all jobs
   */
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running || false,
        scheduled: true
      };
    });
    return status;
  }

  /**
   * Manually trigger MITRE sync
   */
  async triggerMitreSync(force = false) {
    console.log(`🔄 Manually triggering MITRE sync (force: ${force})...`);
    return await this.mitreSyncService.syncMitreData(force);
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService; 