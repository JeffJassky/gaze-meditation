const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT || 3000),
  env: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  mongodbUri: required('MONGODB_URI'),

  session: {
    secret: required('SESSION_SECRET'),
    name: process.env.SESSION_NAME || 'gaze.sid',
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: required('S3_BUCKET'),
    accessKeyId: required('S3_ACCESS_KEY_ID'),
    secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '',
  },

  mail: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    from: process.env.MAIL_FROM || 'Gaze <no-reply@gaze.app>',
    appName: process.env.MAIL_APP_NAME || 'Gaze',
    appUrl: process.env.MAIL_APP_URL || 'http://localhost:5173',
  },
};
