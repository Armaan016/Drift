// app/layout.tsx or pages/_app.tsx
import './globals.css'
import Provider from './components/SessionProvider'

import { Sora } from 'next/font/google'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
})


export const metadata = {
  title: 'Your App',
  description: 'Blah blah',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      {/* <body>{children}</body> */}
      <Provider>
        <body>{children}</body>
      </Provider>
    </html>
  )
}
