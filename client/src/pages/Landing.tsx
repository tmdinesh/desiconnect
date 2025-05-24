import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import desiConnectLogo from "@/assets/desi-connect-logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center">
          <img src={desiConnectLogo} alt="DesiConnect Logo" className="h-12 mr-4" />
          <h1 className="text-2xl font-bold text-gray-900">DesiConnect</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to DesiConnect
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Local roots, global shelves
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {/* Customer Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Customer Portal</CardTitle>
              <CardDescription>Browse and shop products</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 pb-6">
              <div className="mb-4 mt-2 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <p className="text-gray-600">
                Discover unique Indian products and place orders easily.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild className="w-full">
                <Link href="/login">Shop Now</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Seller Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Seller Portal</CardTitle>
              <CardDescription>Manage your business</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 pb-6">
              <div className="mb-4 mt-2 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <p className="text-gray-600">
                List products, manage inventory, and track orders.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild className="w-full">
                <Link href="/seller/login">Seller Login</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Admin Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription>Platform administration</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 pb-6">
              <div className="mb-4 mt-2 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
                  <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"></path>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <p className="text-gray-600">
                Manage sellers, approve products, and review statistics.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild className="w-full">
                <Link href="/admin/login">Admin Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>&copy; {new Date().getFullYear()} DesiConnect. All rights reserved.</p>
            <p className="mt-2 text-gray-400">Local roots, global shelves</p>
          </div>
        </div>
      </footer>
    </div>
  );
}