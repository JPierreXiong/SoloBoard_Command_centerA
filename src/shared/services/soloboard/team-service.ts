/**
 * SoloBoard - 团队协作服务
 * 
 * 功能：
 * 1. 创建和管理团队
 * 2. 邀请和管理团队成员
 * 3. 权限控制
 * 4. 站点共享
 */

import { db } from '@/config/db';
import { teams, teamMembers, teamSites, monitoredSites, user } from '@/config/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * 团队角色
 */
export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

/**
 * 团队权限
 */
export interface TeamPermissions {
  canAddSites?: boolean;
  canEditSites?: boolean;
  canDeleteSites?: boolean;
  canManageMembers?: boolean;
  canViewReports?: boolean;
}

/**
 * 默认角色权限
 */
const DEFAULT_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    canAddSites: true,
    canEditSites: true,
    canDeleteSites: true,
    canManageMembers: true,
    canViewReports: true,
  },
  admin: {
    canAddSites: true,
    canEditSites: true,
    canDeleteSites: true,
    canManageMembers: true,
    canViewReports: true,
  },
  editor: {
    canAddSites: true,
    canEditSites: true,
    canDeleteSites: false,
    canManageMembers: false,
    canViewReports: true,
  },
  viewer: {
    canAddSites: false,
    canEditSites: false,
    canDeleteSites: false,
    canManageMembers: false,
    canViewReports: true,
  },
};

/**
 * 创建团队
 */
export async function createTeam(
  ownerId: string,
  name: string,
  description?: string,
  settings?: { maxMembers?: number; allowGuestAccess?: boolean }
) {
  const teamId = nanoid();

  // 创建团队
  await db().insert(teams).values({
    id: teamId,
    name,
    ownerId,
    description,
    settings,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 添加创建者为团队所有者
  await db().insert(teamMembers).values({
    id: nanoid(),
    teamId,
    userId: ownerId,
    role: 'owner',
    permissions: DEFAULT_PERMISSIONS.owner,
    joinedAt: new Date(),
  });

  console.log(`[Team Service] Team created: ${teamId}`);
  return teamId;
}

/**
 * 邀请团队成员
 */
export async function inviteTeamMember(
  teamId: string,
  inviterId: string,
  userEmail: string,
  role: TeamRole = 'viewer'
) {
  // 验证邀请者权限
  const inviter = await getTeamMember(teamId, inviterId);
  if (!inviter || !inviter.permissions?.canManageMembers) {
    throw new Error('No permission to invite members');
  }

  // 查找被邀请用户
  const invitedUser = await db()
    .select()
    .from(user)
    .where(eq(user.email, userEmail))
    .limit(1);

  if (!invitedUser.length) {
    throw new Error('User not found');
  }

  const invitedUserId = invitedUser[0].id;

  // 检查是否已是成员
  const existingMember = await getTeamMember(teamId, invitedUserId);
  if (existingMember) {
    throw new Error('User is already a team member');
  }

  // 添加成员
  const memberId = nanoid();
  await db().insert(teamMembers).values({
    id: memberId,
    teamId,
    userId: invitedUserId,
    role,
    permissions: DEFAULT_PERMISSIONS[role],
    joinedAt: new Date(),
    invitedBy: inviterId,
  });

  console.log(`[Team Service] Member invited: ${invitedUserId} to team ${teamId}`);
  return memberId;
}

/**
 * 更新成员角色
 */
export async function updateMemberRole(
  teamId: string,
  operatorId: string,
  memberId: string,
  newRole: TeamRole
) {
  // 验证操作者权限
  const operator = await getTeamMember(teamId, operatorId);
  if (!operator || !operator.permissions?.canManageMembers) {
    throw new Error('No permission to update member roles');
  }

  // 不能修改所有者角色
  const member = await db()
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, memberId))
    .limit(1);

  if (!member.length || member[0].role === 'owner') {
    throw new Error('Cannot update owner role');
  }

  // 更新角色和权限
  await db()
    .update(teamMembers)
    .set({
      role: newRole,
      permissions: DEFAULT_PERMISSIONS[newRole],
    })
    .where(eq(teamMembers.id, memberId));

  console.log(`[Team Service] Member role updated: ${memberId} to ${newRole}`);
}

/**
 * 移除团队成员
 */
export async function removeTeamMember(
  teamId: string,
  operatorId: string,
  memberId: string
) {
  // 验证操作者权限
  const operator = await getTeamMember(teamId, operatorId);
  if (!operator || !operator.permissions?.canManageMembers) {
    throw new Error('No permission to remove members');
  }

  // 不能移除所有者
  const member = await db()
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, memberId))
    .limit(1);

  if (!member.length || member[0].role === 'owner') {
    throw new Error('Cannot remove owner');
  }

  // 删除成员
  await db().delete(teamMembers).where(eq(teamMembers.id, memberId));

  console.log(`[Team Service] Member removed: ${memberId}`);
}

/**
 * 共享站点到团队
 */
export async function shareSiteToTeam(
  teamId: string,
  siteId: string,
  userId: string
) {
  // 验证用户是否有权限共享站点
  const member = await getTeamMember(teamId, userId);
  if (!member || !member.permissions?.canAddSites) {
    throw new Error('No permission to share sites');
  }

  // 验证站点所有权
  const site = await db()
    .select()
    .from(monitoredSites)
    .where(eq(monitoredSites.id, siteId))
    .limit(1);

  if (!site.length || site[0].userId !== userId) {
    throw new Error('Site not found or not owned by user');
  }

  // 检查是否已共享
  const existingShare = await db()
    .select()
    .from(teamSites)
    .where(
      and(
        eq(teamSites.teamId, teamId),
        eq(teamSites.siteId, siteId)
      )
    )
    .limit(1);

  if (existingShare.length > 0) {
    throw new Error('Site already shared to team');
  }

  // 共享站点
  const shareId = nanoid();
  await db().insert(teamSites).values({
    id: shareId,
    teamId,
    siteId,
    sharedBy: userId,
    sharedAt: new Date(),
  });

  console.log(`[Team Service] Site shared: ${siteId} to team ${teamId}`);
  return shareId;
}

/**
 * 取消站点共享
 */
export async function unshareSiteFromTeam(
  teamId: string,
  siteId: string,
  userId: string
) {
  // 验证用户权限
  const member = await getTeamMember(teamId, userId);
  if (!member || (!member.permissions?.canDeleteSites && member.role !== 'owner')) {
    throw new Error('No permission to unshare sites');
  }

  // 删除共享
  await db()
    .delete(teamSites)
    .where(
      and(
        eq(teamSites.teamId, teamId),
        eq(teamSites.siteId, siteId)
      )
    );

  console.log(`[Team Service] Site unshared: ${siteId} from team ${teamId}`);
}

/**
 * 获取团队成员信息
 */
async function getTeamMember(teamId: string, userId: string) {
  const members = await db()
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      )
    )
    .limit(1);

  return members.length > 0 ? members[0] : null;
}

/**
 * 获取用户的所有团队
 */
export async function getUserTeams(userId: string) {
  const memberRecords = await db()
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  const teamIds = memberRecords.map((m: any) => m.teamId);

  if (teamIds.length === 0) {
    return [];
  }

  const teamRecords = await db()
    .select()
    .from(teams)
    .where(
      or(...teamIds.map((id: string) => eq(teams.id, id)))
    );

  return teamRecords.map((team: any) => ({
    ...team,
    role: memberRecords.find((m: any) => m.teamId === team.id)?.role,
  }));
}

/**
 * 获取团队的所有成员
 */
export async function getTeamMembers(teamId: string) {
  const members = await db()
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      permissions: teamMembers.permissions,
      joinedAt: teamMembers.joinedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(teamMembers)
    .leftJoin(user, eq(teamMembers.userId, user.id))
    .where(eq(teamMembers.teamId, teamId));

  return members;
}

/**
 * 获取团队共享的站点
 */
export async function getTeamSites(teamId: string) {
  const sites = await db()
    .select({
      id: teamSites.id,
      siteId: teamSites.siteId,
      sharedBy: teamSites.sharedBy,
      sharedAt: teamSites.sharedAt,
      siteName: monitoredSites.name,
      siteUrl: monitoredSites.url,
      sitePlatform: monitoredSites.platform,
      siteStatus: monitoredSites.status,
      lastSnapshot: monitoredSites.lastSnapshot,
    })
    .from(teamSites)
    .leftJoin(monitoredSites, eq(teamSites.siteId, monitoredSites.id))
    .where(eq(teamSites.teamId, teamId));

  return sites;
}

/**
 * 检查用户对站点的访问权限
 */
export async function checkSiteAccess(userId: string, siteId: string): Promise<boolean> {
  // 检查是否是站点所有者
  const site = await db()
    .select()
    .from(monitoredSites)
    .where(eq(monitoredSites.id, siteId))
    .limit(1);

  if (site.length > 0 && site[0].userId === userId) {
    return true;
  }

  // 检查是否通过团队共享访问
  const userTeams = await getUserTeams(userId);
  const teamIds = userTeams.map((t: any) => t.id);

  if (teamIds.length === 0) {
    return false;
  }

  const sharedSites = await db()
    .select()
    .from(teamSites)
    .where(
      and(
        eq(teamSites.siteId, siteId),
        or(...teamIds.map((id: string) => eq(teamSites.teamId, id)))
      )
    )
    .limit(1);

  return sharedSites.length > 0;
}

/**
 * 获取用户可访问的所有站点（包括团队共享）
 */
export async function getUserAccessibleSites(userId: string) {
  // 获取用户自己的站点
  const ownSites = await db()
    .select()
    .from(monitoredSites)
    .where(eq(monitoredSites.userId, userId));

  // 获取团队共享的站点
  const userTeams = await getUserTeams(userId);
  const teamIds = userTeams.map((t: any) => t.id);

  let sharedSites: any[] = [];
  if (teamIds.length > 0) {
    const teamSiteRecords = await db()
      .select({
        site: monitoredSites,
        teamId: teamSites.teamId,
      })
      .from(teamSites)
      .leftJoin(monitoredSites, eq(teamSites.siteId, monitoredSites.id))
      .where(or(...teamIds.map((id: string) => eq(teamSites.teamId, id))));

    sharedSites = teamSiteRecords.map((record: any) => ({
      ...record.site,
      isShared: true,
      teamId: record.teamId,
    }));
  }

  return {
    ownSites,
    sharedSites,
    allSites: [...ownSites, ...sharedSites],
  };
}







