# Seed Notification Channels

## Problem
The Notifications Management UI shows "No notification channels configured" because the database is empty.

## Solution
Run the seed script to populate default notification channels.

## Quick Start

### Option 1: Automatic (Recommended)
This script automatically finds your workspace and creates channels for it:

```bash
cd backend
npx ts-node scripts/seedNotificationChannelsAuto.ts
```

This will:
1. ✅ Find your first workspace in the database
2. ✅ Find an admin user (or use workspace ID)
3. ✅ Create 4 default channels:
   - Primary Email (enabled)
   - Primary SMS (disabled)
   - Push Notifications (enabled)
   - WhatsApp Business (disabled)

### Option 2: Manual
If you want to specify a custom workplaceId:

```bash
cd backend
npx ts-node scripts/seedNotificationChannels.ts
```

Then edit the script to use your actual workplaceId.

## What Gets Created

### 1. Primary Email Channel
- **Type**: email
- **Status**: Enabled
- **Provider**: SMTP
- **Daily Limit**: 10,000
- **Monthly Limit**: 300,000
- **Config**:
  - From: noreply@pharmacycopilot.com
  - Host: smtp.gmail.com
  - Port: 587

### 2. Primary SMS Channel
- **Type**: sms
- **Status**: Disabled (needs configuration)
- **Provider**: Twilio
- **Daily Limit**: 1,000
- **Monthly Limit**: 30,000

### 3. Push Notifications Channel
- **Type**: push
- **Status**: Enabled
- **Provider**: Firebase
- **Daily Limit**: 50,000
- **Monthly Limit**: 1,500,000

### 4. WhatsApp Business Channel
- **Type**: whatsapp
- **Status**: Disabled (needs configuration)
- **Provider**: Twilio
- **Daily Limit**: 1,000
- **Monthly Limit**: 30,000

## After Seeding

1. **Refresh your browser** - The channels should now appear
2. **Configure channels** - Click "Configure" on each channel to set up API keys
3. **Enable/Disable** - Toggle channels on/off as needed
4. **Update limits** - Adjust daily/monthly limits based on your needs

## Verify Seeding

Check if channels were created:

```bash
# In MongoDB shell or Compass
db.notificationchannels.find({})
```

Or check in the UI:
1. Navigate to SaaS Settings → Notifications
2. Click on "Channels" tab
3. You should see 4 channels

## Troubleshooting

### "No workspace found in database"
**Solution**: Create a workspace first or use the manual seed script with a custom workplaceId.

### "Channels already exist"
**Solution**: The script won't overwrite existing channels. To re-seed:
```bash
# Delete existing channels first
db.notificationchannels.deleteMany({})
# Then run seed script again
```

### Channels not showing in UI
**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors
3. Verify API endpoint is working:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/notification-management/channels
   ```

## Customization

To customize the default channels, edit:
- `backend/scripts/seedNotificationChannelsAuto.ts`

You can modify:
- Channel names
- Limits (daily/monthly)
- Default enabled/disabled status
- Provider configurations
- Add more channels

## Next Steps

After seeding:

1. ✅ **Configure Email** - Add your SMTP credentials
2. ✅ **Configure SMS** - Add Twilio credentials and enable
3. ✅ **Configure WhatsApp** - Add Twilio WhatsApp credentials and enable
4. ✅ **Create Templates** - Go to Templates tab and create notification templates
5. ✅ **Create Rules** - Go to Rules tab and set up automation rules
6. ✅ **Test** - Use "Test Notification" button to verify setup

## Production Considerations

Before going to production:

1. **Update Email Config**
   - Use your actual SMTP server
   - Use your domain email address
   - Add proper authentication

2. **Set Realistic Limits**
   - Based on your email provider's limits
   - Based on your Twilio plan
   - Monitor usage regularly

3. **Enable Monitoring**
   - Track delivery rates
   - Monitor failures
   - Set up alerts for limit breaches

4. **Secure API Keys**
   - Store in environment variables
   - Encrypt sensitive data
   - Use secrets management

## Support

If you encounter issues:
1. Check the backend logs
2. Verify MongoDB connection
3. Ensure you're logged in as admin/super_admin
4. Check browser console for frontend errors
