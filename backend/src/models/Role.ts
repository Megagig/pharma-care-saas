import mongoose, { Document, Schema } from 'mongoose';

export interfact.')
    ;
  }

// Remove this role from parent's childRoles array
if (role.parentRole) {
    await mongoose.model('Role').findByIdAndUpdate(
        role.parentRole,
        { $pull: { childRoles: role._id } },
        { new: true }
    );
}

next();
});

// Instance methods
roleSchema.methods.getAllPermissions = async function (): Promise<string[]> {
    const allPermissions = new Set(this.permissions);

    // Inherit permissions from parent roles
    if (this.parentRole) {
        const parentRole = await mongoose.model('Role').findById(this.parentRole);
        if (parentRole) {
            const parentPermissions = await (parentRole as IRole).getAllPermissions();
            parentPermissions.forEach(permission => allPermissions.add(permission));
        }
    }

    return Array.from(allPermissions);
};

roleSchema.methods.hasPermission = function (permission: string): boolean {
    return this.permissions.includes(permission);
};

roleSchema.methods.getHierarchyPath = async function (): Promise<IRole[]> {
    const path: IRole[] = [this];
    let currentRole = this;

    while (currentRole.parentRole) {
        const parentRole = await mongoose.model('Role').findById(currentRole.parentRole);
        if (!parentRole) break;

        path.unshift(parentRole as IRole);
        currentRole = parentRole as IRole;
    }

    return path;
};

export default mongoose.model<IRole>('Role', roleSchema);