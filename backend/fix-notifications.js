const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/SupportTicketService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all sendNotification calls by moving userId out of the object and making it the first parameter
content = content.replace(
    /await this\.notificationService\.sendNotification\("notification-template", "email", \{\s*userId: ([^,]+),/g,
    'await this.notificationService.sendNotification(\n        $1,\n        "notification-template",\n        "email",\n        {'
);

fs.writeFileSync(filePath, content);
console.log('Fixed all notification calls in SupportTicketService.ts');