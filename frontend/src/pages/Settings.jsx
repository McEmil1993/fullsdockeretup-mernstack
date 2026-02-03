import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import { Moon, Sun, Palette, Type, Gauge, Image, LogIn, Calendar } from 'lucide-react'

const Settings = () => {
  const { settings, updateSettings, resetSettings, loading } = useSettings()
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    activeSchoolYear: settings.activeSchoolYear || '2025-2026',
    activeTerm: settings.activeTerm || 'Prelim',
    sideNavFontColor: settings.sideNavFontColor || '#e2e8f0',
    sideNavHoverColor: settings.sideNavHoverColor || '#ffffff',
    sideNavActiveColor: settings.sideNavActiveColor || '#ffffff',
    topNavFontColor: settings.topNavFontColor || '#1f2937',
    loginBackgroundType: settings.loginBackgroundType || 'color',
    loginBackgroundColor: settings.loginBackgroundColor || '#e0e7ff',
    loginBackgroundImage: settings.loginBackgroundImage || '',
    loginFormBgColor: settings.loginFormBgColor || '#ffffff',
    loginFormBgOpacity: settings.loginFormBgOpacity !== undefined ? settings.loginFormBgOpacity : 100,
  })

  const schoolYears = [
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
  ]

  const terms = [
    'Prelim',
    'Midterm',
    'Semi-final',
    'Final',
  ]

  const fontFamilies = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Ubuntu',
    'Nunito',
    'Source Sans Pro',
    'Playfair Display',
    'Merriweather',
    'Work Sans',
    'DM Sans',
    'Space Grotesk',
    'Plus Jakarta Sans',
    'Outfit',
    'Manrope',
    'Figtree',
    'Cabin',
    'Quicksand',
    'Comfortaa',
    'Barlow',
    'Fira Sans',
    'Oswald',
    'Dancing Script',
    'Pacifico',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Courier New',
    
  ]

  const fontSizeOptions = ['12px', '14px', '16px', '18px', '20px', '22px', '24px']

  const colorPresets = {
    sideNav: [
      { name: 'Slate', value: '#1e293b' },
      { name: 'Blue', value: '#1e40af' },
      { name: 'Purple', value: '#6b21a8' },
      { name: 'Green', value: '#166534' },
      { name: 'Red', value: '#991b1b' },
    ],
    topNav: [
      { name: 'White', value: '#ffffff' },
      { name: 'Light Gray', value: '#f3f4f6' },
      { name: 'Slate', value: '#475569' },
      { name: 'Blue', value: '#3b82f6' },
    ],
  }

  const handleChange = (key, value) => {
    // Update local state immediately
    const updated = { ...localSettings, [key]: value }
    setLocalSettings(updated)
    
    // Update only the changed field to database in real-time
    updateSettings({ [key]: value })
  }

  // Sync localSettings with context settings when they change
  useEffect(() => {
    setLocalSettings({
      ...settings,
      activeSchoolYear: settings.activeSchoolYear || '2025-2026',
      activeTerm: settings.activeTerm || 'Prelim',
      sideNavFontColor: settings.sideNavFontColor || '#e2e8f0',
      sideNavHoverColor: settings.sideNavHoverColor || '#ffffff',
      sideNavActiveColor: settings.sideNavActiveColor || '#ffffff',
      topNavFontColor: settings.topNavFontColor || '#1f2937',
      loginBackgroundType: settings.loginBackgroundType || 'color',
      loginBackgroundColor: settings.loginBackgroundColor || '#e0e7ff',
      loginBackgroundImage: settings.loginBackgroundImage || '',
      loginFormBgColor: settings.loginFormBgColor || '#ffffff',
      loginFormBgOpacity: settings.loginFormBgOpacity !== undefined ? settings.loginFormBgOpacity : 100,
    })
  }, [settings])

  const handleReset = async () => {
    try {
      await resetSettings()
      // localSettings will be updated via useEffect when settings context updates
    } catch (error) {
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <Skeleton variant="title" className="h-8 w-40 mb-2" />
          <Skeleton variant="text" className="h-4 w-80" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="avatar" className="w-6 h-6" />
                <Skeleton variant="heading" className="h-6 w-32" />
              </div>
              <Skeleton variant="text" className="h-4 w-full mb-4" />
              <Skeleton variant="text" className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Customize your application appearance and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active School Year & Term */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              School Year & Term
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set the active school year and term for the entire system
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active School Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                School Year
              </label>
              <select
                value={localSettings.activeSchoolYear}
                onChange={(e) => handleChange('activeSchoolYear', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {schoolYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active Term
              </label>
              <select
                value={localSettings.activeTerm}
                onChange={(e) => handleChange('activeTerm', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            {localSettings.darkMode ? (
              <Moon className="w-6 h-6 text-gray-900 dark:text-white" />
            ) : (
              <Sun className="w-6 h-6 text-gray-900 dark:text-white" />
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Theme Mode
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Switch between light and dark mode
          </p>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.darkMode}
              onChange={(e) => handleChange('darkMode', e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-14 h-7 rounded-full transition-colors ${
              localSettings.darkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                localSettings.darkMode ? 'transform translate-x-7' : ''
              }`}></div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {localSettings.darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </label>
        </div>

        {/* Font Family */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Font Family
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose your preferred font family
          </p>
          <select
            value={localSettings.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ fontFamily: localSettings.fontFamily }}
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Gauge className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Font Size
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Adjust the base font size
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="12"
              max="24"
              value={parseInt(localSettings.fontSize)}
              onChange={(e) => handleChange('fontSize', `${e.target.value}px`)}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-right">
              {localSettings.fontSize}
            </span>
          </div>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p style={{ fontSize: localSettings.fontSize, fontFamily: localSettings.fontFamily }}>
              Preview: The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>

        {/* Side Navigation Colors - Combined */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Side Navigation Colors
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {colorPresets.sideNav.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleChange('sideNavColor', color.value)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      localSettings.sideNavColor === color.value
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.sideNavColor}
                  onChange={(e) => handleChange('sideNavColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.sideNavColor}
                  onChange={(e) => handleChange('sideNavColor', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#1e293b"
                />
              </div>
            </div>

            {/* Font Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Font Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.sideNavFontColor || '#e2e8f0'}
                  onChange={(e) => handleChange('sideNavFontColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.sideNavFontColor || '#e2e8f0'}
                  onChange={(e) => handleChange('sideNavFontColor', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#e2e8f0"
                />
              </div>
            </div>

            {/* Hover Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hover Font Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.sideNavHoverColor || '#ffffff'}
                  onChange={(e) => handleChange('sideNavHoverColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.sideNavHoverColor || '#ffffff'}
                  onChange={(e) => handleChange('sideNavHoverColor', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Active Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active Font Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.sideNavActiveColor || '#ffffff'}
                  onChange={(e) => handleChange('sideNavActiveColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.sideNavActiveColor || '#ffffff'}
                  onChange={(e) => handleChange('sideNavActiveColor', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TopNav Font Color */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Top Navigation Font Color
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set the text color for top navigation
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={localSettings.topNavFontColor || '#1f2937'}
              onChange={(e) => handleChange('topNavFontColor', e.target.value)}
              className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={localSettings.topNavFontColor || '#1f2937'}
              onChange={(e) => handleChange('topNavFontColor', e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#1f2937"
            />
          </div>
        </div>

        {/* TopNav Color */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Top Navigation Color
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Customize the top navigation background color
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {colorPresets.topNav.map((color) => (
              <button
                key={color.value}
                onClick={() => handleChange('topNavColor', color.value)}
                className={`h-12 rounded-lg border-2 transition-all ${
                  localSettings.topNavColor === color.value
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={localSettings.topNavColor}
              onChange={(e) => handleChange('topNavColor', e.target.value)}
              className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={localSettings.topNavColor}
              onChange={(e) => handleChange('topNavColor', e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Login Background */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <LogIn className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Login Page Background
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Customize the login page background (color or image)
          </p>
          
          <div className="space-y-4">
            {/* Background Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loginBackgroundType"
                    value="color"
                    checked={localSettings.loginBackgroundType === 'color'}
                    onChange={(e) => handleChange('loginBackgroundType', e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Background Color</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loginBackgroundType"
                    value="image"
                    checked={localSettings.loginBackgroundType === 'image'}
                    onChange={(e) => handleChange('loginBackgroundType', e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Background Image</span>
                </label>
              </div>
            </div>

            {/* Background Color */}
            {localSettings.loginBackgroundType === 'color' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localSettings.loginBackgroundColor || '#e0e7ff'}
                    onChange={(e) => handleChange('loginBackgroundColor', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localSettings.loginBackgroundColor || '#e0e7ff'}
                    onChange={(e) => handleChange('loginBackgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#e0e7ff"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Preview: <span className="px-2 py-1 rounded" style={{ backgroundColor: localSettings.loginBackgroundColor || '#e0e7ff' }}>Color Preview</span>
                </p>
              </div>
            )}

            {/* Background Image */}
            {localSettings.loginBackgroundType === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Image URL
                </label>
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    value={localSettings.loginBackgroundImage || ''}
                    onChange={(e) => handleChange('loginBackgroundImage', e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {localSettings.loginBackgroundImage && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <img
                      src={localSettings.loginBackgroundImage}
                      alt="Background preview"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Enter a valid image URL (jpg, png, etc.)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Login Form Background */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Login Form Background
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Customize the login form card background color and transparency
          </p>
          
          <div className="space-y-4">
            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localSettings.loginFormBgColor || '#ffffff'}
                  onChange={(e) => handleChange('loginFormBgColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.loginFormBgColor || '#ffffff'}
                  onChange={(e) => handleChange('loginFormBgColor', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Opacity/Transparency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opacity: {localSettings.loginFormBgOpacity || 100}%
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.loginFormBgOpacity !== undefined ? localSettings.loginFormBgOpacity : 100}
                  onChange={(e) => handleChange('loginFormBgOpacity', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-right">
                  {localSettings.loginFormBgOpacity !== undefined ? localSettings.loginFormBgOpacity : 100}%
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                0% = Fully transparent, 100% = Fully opaque
              </p>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </label>
              <div 
                className="w-full h-24 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                style={{
                  backgroundColor: localSettings.loginFormBgColor || '#ffffff',
                  opacity: (localSettings.loginFormBgOpacity !== undefined ? localSettings.loginFormBgOpacity : 100) / 100,
                }}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Form Background Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>
    </div>
  )
}

export default Settings
