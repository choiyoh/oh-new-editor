const token = process.env.NODE_AUTH_TOKEN;
if (!token || token.startsWith('XXXXX-')) {
  console.error('Publishing requires the repository Actions secret NPM_TOKEN, passed as NODE_AUTH_TOKEN. Configure npm scope access and authentication before publishing.');
  process.exit(1);
}
