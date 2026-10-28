import type { CreditsContent } from '@optica/core/ui/credits'

// logos shared by the viewers, an app specific one can be put in src/assets
import belspoLogo from '@optica/core/assets/images/credits/belspo.svg'
import rbinsLogo from '@optica/core/assets/images/credits/rbins.svg'
import africamuseumLogo from '@optica/core/assets/images/credits/africamuseum.svg'

// Content of Help > Credits
export const credits: CreditsContent = {
  developers: [
    { name: 'Yann Pollet' },
  ],
  projects: [
    { name: 'BELSPO', invert: false, logo: belspoLogo, projects: ["DIGIT-04", "CANATHIST", "Be-DiSSCo FED"] },
  ],
  institutions: [
    { name: 'Royal Belgian Institute of Natural Sciences', invert: true, logo: rbinsLogo, url: 'https://www.naturalsciences.be' },
    { name: 'Royal Museum for Central Africa', invert: true, logo: africamuseumLogo, url: 'https://www.africamuseum.be' },
  ],
}
