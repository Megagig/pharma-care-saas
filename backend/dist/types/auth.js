"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExtendedUser = isExtendedUser;
exports.hasUserRole = hasUserRole;
exports.hasWorkplaceRole = hasWorkplaceRole;
exports.hasUserStatus = hasUserStatus;
exports.hasAssignedRoles = hasAssignedRoles;
exports.hasPermissions = hasPermissions;
exports.hasCachedPermissions = hasCachedPermissions;
exports.hasLastPermissionCheck = hasLastPermissionCheck;
exports.getUserRole = getUserRole;
exports.getUserWorkplaceRole = getUserWorkplaceRole;
exports.getUserStatus = getUserStatus;
exports.getUserAssignedRoles = getUserAssignedRoles;
exports.getUserPermissions = getUserPermissions;
exports.getUserCachedPermissions = getUserCachedPermissions;
exports.getUserLastPermissionCheck = getUserLastPermissionCheck;
exports.getUserId = getUserId;
exports.getWorkplaceId = getWorkplaceId;
const mongoose_1 = require("mongoose");
function isExtendedUser(user) {
    return user !== undefined &&
        typeof user === 'object' &&
        'email' in user &&
        'passwordHash' in user &&
        'firstName' in user &&
        'lastName' in user;
}
function hasUserRole(user) {
    return user !== undefined && typeof user.role === 'string';
}
function hasWorkplaceRole(user) {
    return user !== undefined && typeof user.workplaceRole === 'string';
}
function hasUserStatus(user) {
    return user !== undefined && typeof user.status === 'string';
}
function hasAssignedRoles(user) {
    return user !== undefined && Array.isArray(user.assignedRoles);
}
function hasPermissions(user) {
    return user !== undefined && Array.isArray(user.permissions);
}
function hasCachedPermissions(user) {
    return user !== undefined &&
        typeof user.cachedPermissions === 'object' &&
        user.cachedPermissions !== null &&
        Array.isArray(user.cachedPermissions.permissions);
}
function hasLastPermissionCheck(user) {
    return user !== undefined && user.lastPermissionCheck instanceof Date;
}
function getUserRole(user) {
    return hasUserRole(user) ? user.role : undefined;
}
function getUserWorkplaceRole(user) {
    return hasWorkplaceRole(user) ? user.workplaceRole : undefined;
}
function getUserStatus(user) {
    return hasUserStatus(user) ? user.status : undefined;
}
function getUserAssignedRoles(user) {
    return hasAssignedRoles(user) ? user.assignedRoles : undefined;
}
function getUserPermissions(user) {
    return hasPermissions(user) ? user.permissions : undefined;
}
function getUserCachedPermissions(user) {
    return hasCachedPermissions(user) ? user.cachedPermissions : undefined;
}
function getUserLastPermissionCheck(user) {
    return hasLastPermissionCheck(user) ? user.lastPermissionCheck : undefined;
}
function getUserId(user) {
    if (!user)
        return undefined;
    return user.id || user._id?.toString();
}
function getWorkplaceId(user) {
    if (!user?.workplaceId)
        return undefined;
    if (typeof user.workplaceId === 'string') {
        return new mongoose_1.Types.ObjectId(user.workplaceId);
    }
    return user.workplaceId;
}
//# sourceMappingURL=auth.js.map