import Footer from '@/components/footer'
import Header from '@/components/header'
import Hero from '@/components/hero'

const Page = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Hero />
      </main>
      <Footer />
    </div>
  )
}

export default Page
