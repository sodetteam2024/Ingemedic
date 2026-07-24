import LandingPage from './LandingPage'
import { createClient } from '@/lib/supabase-server'

export const revalidate = 86400

export default async function Page() {
  const supabase = await createClient()
  const { data: empresa } = await supabase
    .from('configuracion_empresa')
    .select('tel, dir')
    .single()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Ingemedic de Colombia S.A.S.',
    description:
      'Alquiler de equipos biomédicos y suministro de oxígeno medicinal en Valledupar y el departamento del Cesar, Colombia.',
    url: 'https://ingemedic.com.co',
    areaServed: ['Valledupar', 'Cesar'],
    address: {
      '@type': 'PostalAddress',
      ...(empresa?.dir && { streetAddress: empresa.dir }),
      addressLocality: 'Valledupar',
      addressRegion: 'Cesar',
      addressCountry: 'CO',
    },
    ...(empresa?.tel && { telephone: empresa.tel }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
