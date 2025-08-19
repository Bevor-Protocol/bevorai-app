import api from "@/lib/api";
import {
  CreateTeamBody,
  InviteMemberBody,
  MemberInviteSchema,
  MemberSchema,
  TeamSchemaI,
  UpdateMemberBody,
  UpdateTeamBody,
} from "@/utils/types";

class TeamService {
  async createTeam(data: CreateTeamBody): Promise<TeamSchemaI> {
    return api.post("/teams", data).then((response) => {
      return response.data.id;
    });
  }

  async getTeam(): Promise<TeamSchemaI> {
    return api.get("/teams").then((response) => {
      return response.data;
    });
  }

  async getTeams(): Promise<TeamSchemaI[]> {
    return api.get("/teams/all", { headers: { "skip-team": true } }).then((response) => {
      return response.data.results;
    });
  }

  async deleteTeam(): Promise<boolean> {
    // TODO: come back to this, we'll need to reissue a token or something.
    return api.delete("/teams").then((response) => {
      return response.data.success;
    });
  }

  async updateTeam(data: UpdateTeamBody): Promise<TeamSchemaI> {
    return api.patch("/teams", data).then((response) => {
      return response.data;
    });
  }

  async getInvites(): Promise<MemberInviteSchema[]> {
    return api.get("/team-members/invites").then((response) => {
      return response.data.results;
    });
  }

  async inviteMembers(data: InviteMemberBody): Promise<boolean> {
    return api.post("/team-members/invites", data).then((response) => {
      return response.data.success;
    });
  }

  async removeInvite(inviteId: string): Promise<boolean> {
    return api.delete(`/team-members/invites/${inviteId}`).then((response) => {
      return response.data.success;
    });
  }

  async acceptInvite(inviteId: string): Promise<string> {
    return api.post(`/team-members/invites/${inviteId}`, {}).then((response) => {
      return response.data.id;
    });
  }

  async updateMember(memberId: string, data: UpdateMemberBody): Promise<boolean> {
    return api.patch(`/team-members/members/${memberId}`, data).then((response) => {
      return response.data.success;
    });
  }

  async removeMember(memberId: string): Promise<boolean> {
    return api.delete(`/team-members/members/${memberId}`).then((response) => {
      return response.data.success;
    });
  }

  async getMembers(): Promise<MemberSchema[]> {
    return api.get("/team-members/members").then((response) => {
      return response.data.results;
    });
  }

  async getCurrentMember(): Promise<MemberSchema> {
    return api.get("/team-members/members/current").then((response) => {
      return response.data;
    });
  }
}

const teamService = new TeamService();
export default teamService;
