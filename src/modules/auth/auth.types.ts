export interface AuthUserResponse {
  id: number;
  clerkId: string;
  name: string;
  email: string;
  photoUrl: string;
  status: string;
  business_id: number;
  branch_id: number | null;
  roles: unknown[];
  permissions: Record<string, unknown>;
}
