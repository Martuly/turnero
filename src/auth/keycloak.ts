import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'tuturno',
  clientId: 'tuturno-web',
});

export default keycloak;