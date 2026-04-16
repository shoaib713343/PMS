import cron from 'node-cron';
import { taskReminderService } from '../services/taskReminder.service';


cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Cron job triggered: Task Due Reminders');
    console.log('=' .repeat(50));
    
    const result = await taskReminderService.runDueDateReminders();
    
    console.log('=' .repeat(50));
    console.log(`📊 Result: ${result.success ? 'Success' : 'Failed'}`);
    if (result.remindersSent) {
        console.log(`📧 Reminders sent: ${result.remindersSent}`);
    }
    console.log('=' .repeat(50));
});

console.log('✅ Task due reminder cron job scheduled to run daily at 9:00 AM');