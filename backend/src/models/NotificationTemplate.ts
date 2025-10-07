import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface ITemplateContent {
  subject?: string; // For email/push notifications
  body: string;
  htmlBody?: string; // For email notifications
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

export interface INotificationTemplate extends Document {
  name: string;
  description?: string;
  workspaceId?: mongoose.Types.ObjectId;
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'inApp';
  category: 'system' | 'user' | 'billing' | 'security' | 'marketing' | 'transactional';
  content: ITemplateContent;
  variables: ITemplateVariable[];
  isActive: boolean;
  isDefault: boolean; // System default templates
  version: number;
  previousVersions: {
    version: number;
    content: ITemplateContent;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
  }[];
  tags: string[];
  usageCount: number;
  lastUsed?: Date;
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Convenience properties for backward compatibility
  subject?: string;
  body: string;
}

const templateVariableSchema = new Schema<ITemplateVariable>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'object', 'array'],
    required: true,
  },
  required: {
    type: Boolean,
    required: true,
    default: false,
  },
  defaultValue: {
    type: Schema.Types.Mixed,
  },
  description: {
    type: String,
    trim: true,
  },
}, { _id: false });

const templateContentSchema = new Schema<ITemplateContent>({
  subject: {
    type: String,
    trim: true,
  },
  body: {
    type: String,
    required: true,
    trim: true,
  },
  htmlBody: {
    type: String,
    trim: true,
  },
  attachments: [{
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  }],
}, { _id: false });

const previousVersionSchema = new Schema({
  version: {
    type: Number,
    required: true,
  },
  content: {
    type: templateContentSchema,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { _id: false });

const notificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workplace',
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'whatsapp', 'inApp'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['system', 'user', 'billing', 'security', 'marketing', 'transactional'],
      required: true,
      index: true,
    },
    content: {
      type: templateContentSchema,
      required: true,
    },
    variables: [templateVariableSchema],
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    previousVersions: [previousVersionSchema],
    tags: [{
      type: String,
      trim: true,
    }],
    usageCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastUsed: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'notificationtemplates',
  }
);

// Compound indexes
notificationTemplateSchema.index({ channel: 1, category: 1, isActive: 1 });
notificationTemplateSchema.index({ workspaceId: 1, isActive: 1 });
notificationTemplateSchema.index({ tags: 1, isActive: 1 });
notificationTemplateSchema.index({ usageCount: -1, isActive: 1 });
notificationTemplateSchema.index({ name: 1, workspaceId: 1 }, { unique: true });

// Methods
notificationTemplateSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

notificationTemplateSchema.methods.render = function (variables: Record<string, any> = {}): ITemplateContent {
  const renderedContent: ITemplateContent = {
    body: this.renderString(this.content.body, variables),
  };

  if (this.content.subject) {
    renderedContent.subject = this.renderString(this.content.subject, variables);
  }

  if (this.content.htmlBody) {
    renderedContent.htmlBody = this.renderString(this.content.htmlBody, variables);
  }

  if (this.content.attachments) {
    renderedContent.attachments = this.content.attachments.map(attachment => ({
      ...attachment,
      url: this.renderString(attachment.url, variables),
    }));
  }

  return renderedContent;
};

notificationTemplateSchema.methods.renderString = function (template: string, variables: Record<string, any>): string {
  let rendered = template;

  // Replace variables in the format {{variableName}}
  rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    if (variables.hasOwnProperty(variableName)) {
      return String(variables[variableName]);
    }

    // Check for default value
    const variable = this.variables.find((v: ITemplateVariable) => v.name === variableName);
    if (variable && variable.defaultValue !== undefined) {
      return String(variable.defaultValue);
    }

    // Return original placeholder if no value found
    return match;
  });

  // Handle conditional blocks: {{#if condition}}content{{/if}}
  rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
    return variables[condition] ? content : '';
  });

  // Handle loops: {{#each items}}{{name}}{{/each}}
  rendered = rendered.replace(/\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs, (match, arrayName, itemTemplate) => {
    const array = variables[arrayName];
    if (!Array.isArray(array)) return '';

    return array.map(item => {
      return itemTemplate.replace(/\{\{(\w+)\}\}/g, (itemMatch, itemProp) => {
        return item[itemProp] || itemMatch;
      });
    }).join('');
  });

  return rendered;
};

notificationTemplateSchema.methods.validateVariables = function (variables: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required variables
  this.variables.forEach((variable: ITemplateVariable) => {
    if (variable.required && !variables.hasOwnProperty(variable.name)) {
      errors.push(`Required variable '${variable.name}' is missing`);
    }
  });

  // Type validation
  this.variables.forEach((variable: ITemplateVariable) => {
    if (variables.hasOwnProperty(variable.name)) {
      const value = variables[variable.name];
      const isValidType = this.validateVariableType(value, variable.type);
      if (!isValidType) {
        errors.push(`Variable '${variable.name}' must be of type '${variable.type}'`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

notificationTemplateSchema.methods.validateVariableType = function (value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'date':
      return value instanceof Date || !isNaN(Date.parse(value));
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return false;
  }
};

notificationTemplateSchema.methods.createNewVersion = function (newContent: ITemplateContent, userId: mongoose.Types.ObjectId): void {
  // Store current version in history
  this.previousVersions.push({
    version: this.version,
    content: this.content,
    createdAt: new Date(),
    createdBy: userId,
  });

  // Update to new version
  this.version += 1;
  this.content = newContent;
  this.lastModifiedBy = userId;

  // Keep only last 10 versions
  if (this.previousVersions.length > 10) {
    this.previousVersions = this.previousVersions.slice(-10);
  }
};

notificationTemplateSchema.methods.incrementUsage = function (): void {
  this.usageCount += 1;
  this.lastUsed = new Date();
};

notificationTemplateSchema.methods.approve = function (approverId: mongoose.Types.ObjectId): void {
  this.approvedBy = approverId;
  this.approvedAt = new Date();
};

// Static methods
notificationTemplateSchema.statics.findByChannelAndCategory = function (
  channel: string,
  category: string,
  workspaceId?: mongoose.Types.ObjectId
) {
  const query: any = { channel, category, isActive: true };
  if (workspaceId) {
    query.$or = [{ workspaceId }, { workspaceId: null, isDefault: true }];
  } else {
    query.workspaceId = null;
    query.isDefault = true;
  }

  return this.find(query).sort({ usageCount: -1 });
};

notificationTemplateSchema.statics.findDefaultTemplate = function (channel: string, category: string) {
  return this.findOne({
    channel,
    category,
    isDefault: true,
    isActive: true,
    workspaceId: null
  });
};

notificationTemplateSchema.statics.getPopularTemplates = function (workspaceId?: mongoose.Types.ObjectId, limit: number = 10) {
  const query: any = { isActive: true };
  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  return this.find(query)
    .sort({ usageCount: -1, lastUsed: -1 })
    .limit(limit);
};

notificationTemplateSchema.statics.createDefaultTemplates = function (workspaceId?: mongoose.Types.ObjectId, adminId?: mongoose.Types.ObjectId) {
  const defaultTemplates = [
    {
      name: 'Welcome Email',
      channel: 'email',
      category: 'user',
      content: {
        subject: 'Welcome to {{appName}}!',
        body: 'Hello {{firstName}},\n\nWelcome to {{appName}}! We\'re excited to have you on board.',
        htmlBody: '<h1>Welcome to {{appName}}!</h1><p>Hello {{firstName}},</p><p>Welcome to {{appName}}! We\'re excited to have you on board.</p>',
      },
      variables: [
        { name: 'firstName', type: 'string', required: true },
        { name: 'appName', type: 'string', required: true, defaultValue: 'PharmacyCopilot' },
      ],
      isDefault: !workspaceId,
    },
    {
      name: 'Password Reset',
      channel: 'email',
      category: 'security',
      content: {
        subject: 'Password Reset Request',
        body: 'Hello {{firstName}},\n\nYou requested a password reset. Click the link below to reset your password:\n{{resetLink}}',
        htmlBody: '<p>Hello {{firstName}},</p><p>You requested a password reset. <a href="{{resetLink}}">Click here to reset your password</a></p>',
      },
      variables: [
        { name: 'firstName', type: 'string', required: true },
        { name: 'resetLink', type: 'string', required: true },
      ],
      isDefault: !workspaceId,
    },
    {
      name: 'System Alert',
      channel: 'inApp',
      category: 'system',
      content: {
        subject: 'System Alert',
        body: '{{alertMessage}}',
      },
      variables: [
        { name: 'alertMessage', type: 'string', required: true },
      ],
      isDefault: !workspaceId,
    },
  ];

  return Promise.all(
    defaultTemplates.map(template =>
      this.create({
        ...template,
        workspaceId,
        createdBy: adminId,
        lastModifiedBy: adminId,
      })
    )
  );
};

// Add virtual properties for backward compatibility
notificationTemplateSchema.virtual('subject').get(function () {
  return this.content.subject;
});

notificationTemplateSchema.virtual('body').get(function () {
  return this.content.body;
});

export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', notificationTemplateSchema);