import { useState, useEffect } from 'react'
import { Image as ImageIcon, Download, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import SkeletonImageGrid from '../components/SkeletonImageGrid'
import Skeleton from '../components/Skeleton'

const Images = () => {
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    // Simulate loading for 1 second
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const images = [
    { id: 1, url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', title: 'Mountain Landscape' },
    { id: 2, url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400', title: 'Ocean View' },
    { id: 3, url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', title: 'Forest Path' },
    { id: 4, url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400', title: 'City Skyline' },
    { id: 5, url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400', title: 'Sunset' },
    { id: 6, url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400', title: 'Aurora' },
  ]

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <Skeleton variant="title" className="h-8 w-48 mb-2" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>

        <SkeletonImageGrid count={8} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Images Gallery
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Browse and manage your image collection
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((image) => (
          <div
            key={image.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center gap-2">
                <button
                  onClick={() => setSelectedImage(image)}
                  className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 p-2 bg-white rounded-full hover:bg-gray-100"
                  title="View"
                >
                  <Eye className="w-5 h-5 text-gray-800" />
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 p-2 bg-white rounded-full hover:bg-gray-100"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-gray-800" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {image.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Image #{image.id}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={selectedImage?.title}
        size="lg"
      >
        {selectedImage && (
          <div className="space-y-4">
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full rounded-lg"
            />
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                {selectedImage.title}
              </p>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Images
