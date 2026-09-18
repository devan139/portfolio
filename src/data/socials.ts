export interface SocialLink {
  name: string;
  url: string;
  isEmail?: boolean;
}

export const socials: SocialLink[] = [
  {
    name: 'LINKEDIN',
    url: 'https://www.linkedin.com/in/devanarayanan-mp/'
  },
  {
    name: 'GITHUB',
    url: 'https://github.com/devan139'
  },
  {
    name: 'EMAIL',
    url: 'mailto:devanarayananmp1@gmail.com',
    isEmail: true
  }
];
