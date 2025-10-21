import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Upload from './pages/Upload'
import FileList from './pages/FileList'
import Review from './pages/Review'

function App() {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen">
      {/* Modern Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-soft border-b border-neutral-200/50'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-greenscope rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gradient">Greenscope AI</h1>
                    <p className="text-xs text-neutral-500 -mt-1">ESG Factsheet Intelligence</p>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                <Link
                  to="/upload"
                  className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload
                </Link>
                <Link
                  to="/files"
                  className={`nav-link ${isActive('/files') ? 'active' : ''}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Files
                </Link>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-greenscope-50 rounded-full">
                <div className="w-2 h-2 bg-greenscope-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-greenscope-700">AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/files" element={<FileList />} />
          <Route path="/file/:id" element={<Review />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

