export type AuthSession = {
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
};
