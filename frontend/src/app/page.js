"use client"

import { useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Home() {
  const webcamRef = useRef(null)
  const [mode, setMode] = useState("realtime") // "realtime", "upload", "capture"
  const [description, setDescription] = useState("")
  const [detailedDescription, setDetailedDescription] = useState("")
  const [loadingDescription, setLoadingDescription] = useState(false)
  const [loadingDetailed, setLoadingDetailed] = useState(false)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [uploadedFile, setUploadedFile] = useState(null)
  const [lastDescribedImage, setLastDescribedImage] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [showRecapture, setShowRecapture] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [countdown, setCountdown] = useState(15)
  const [isCountdownActive, setIsCountdownActive] = useState(false)
  const INTERVAL_MS = 15000

  const dataURLtoBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(",")
    const mime = header.match(/:(.*?);/)[1]
    const binary = atob(base64)
    let length = binary.length
    const array = new Uint8Array(length)
    while (length--) array[length] = binary.charCodeAt(length)
    return new Blob([array], { type: mime })
  }

  // Realtime: capture + describe image
  const captureAndDescribe = async () => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return
    setCapturedImage(imageSrc)
    setShowRecapture(true)
    const blob = dataURLtoBlob(imageSrc)
    await sendImageForDescription(blob)
  }

  // Send image for basic description
  const sendImageForDescription = async (file) => {
    setLoadingDescription(true)
    setDescription("")
    setAnswer("")
    setDetailedDescription("")
    setLastDescribedImage(file)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`${BACKEND_URL}/image/describe`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setDescription(data.description || "No description received.")
    } catch (error) {
      setDescription("Error fetching description.")
    } finally {
      setLoadingDescription(false)
    }
  }

  // Send image for detailed description
  const sendImageForDetailedDescription = async () => {
    if (!lastDescribedImage) {
      alert("No image available. Please capture or upload one first.")
      return
    }
    setLoadingDetailed(true)
    setDetailedDescription("")
    const formData = new FormData()
    formData.append("file", lastDescribedImage)

    try {
      const res = await fetch(`${BACKEND_URL}/image/details`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setDetailedDescription(data.detailed_description || "No detailed description received.")
    } catch (error) {
      setDetailedDescription("Error fetching detailed description.")
    } finally {
      setLoadingDetailed(false)
    }
  }

  // Ask a question about the last described image
  const sendImageQuestion = async () => {
    if (!question) {
      alert("Please enter a question.")
      return
    }
    if (!lastDescribedImage) {
      alert("No image available. Please capture or upload one first.")
      return
    }
    setLoadingQuestion(true)
    setAnswer("")

    const formData = new FormData()
    formData.append("file", lastDescribedImage)
    formData.append("question", question)

    try {
      const res = await fetch(`${BACKEND_URL}/image/question`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setAnswer(data.answer || "No answer received.")
    } catch (error) {
      setAnswer("Error fetching answer.")
    } finally {
      setLoadingQuestion(false)
    }
  }

  // Recapture function
  const handleRecapture = () => {
    setCapturedImage(null)
    setShowRecapture(false)
    setDescription("")
    setDetailedDescription("")
    setAnswer("")
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Countdown effect for realtime mode
  useEffect(() => {
    if (mode !== "realtime") {
      setIsCountdownActive(false)
      setCountdown(15)
      return
    }

    setIsCountdownActive(true)
    setCountdown(15)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          captureAndDescribe()
          return 15 // Reset countdown
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [mode])

  // Reset countdown when mode changes
  useEffect(() => {
    if (mode === "realtime") {
      setCountdown(15)
    }
  }, [mode])

  const themeClasses = {
    background: darkMode ? "bg-black" : "bg-gray-50",
    cardBg: darkMode ? "bg-gray-900" : "bg-white",
    cardBorder: darkMode ? "border-gray-700" : "border-gray-200",
    textPrimary: darkMode ? "text-white" : "text-gray-900",
    textSecondary: darkMode ? "text-gray-300" : "text-gray-600",
    textMuted: darkMode ? "text-gray-400" : "text-gray-500",
    inputBg: darkMode ? "bg-gray-800" : "bg-gray-50",
    inputBorder: darkMode ? "border-gray-600" : "border-gray-300",
    hoverBg: darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50",
    sectionBg: darkMode ? "bg-gray-800" : "bg-gray-50",
    sectionBorder: darkMode ? "border-gray-700" : "border-gray-200",
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300`}>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Dark Mode Toggle */}
        <div className="text-center mb-12 relative">
          {/* Dark Mode Toggle */}
          <div className="absolute top-0 right-0">
            <button
              onClick={toggleDarkMode}
              className={`
                p-3 rounded-full transition-all duration-300 shadow-lg
                ${
                  darkMode ? "bg-yellow-500 hover:bg-yellow-400 text-black" : "bg-gray-800 hover:bg-gray-700 text-white"
                }
              `}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span className="text-xl">{darkMode ? "☀️" : "🌙"}</span>
            </button>
          </div>

          <div className={`inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 shadow-lg`}>
            <span className="text-2xl text-white">🎥</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.textPrimary} mb-4`}>AI Vision Studio</h1>
          <p className={`text-lg ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
            Real-time object identification powered by Gemini AI. Capture, upload, or stream live video for intelligent
            image analysis.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-8 flex justify-center">
          <div
            className={`inline-flex ${themeClasses.cardBg} rounded-lg shadow-md border ${themeClasses.cardBorder} p-1`}
          >
            {[
              { value: "realtime", label: "Live Stream", icon: "🔴" },
              { value: "upload", label: "Upload Image", icon: "📁" },
              { value: "capture", label: "Capture Photo", icon: "📸" },
            ].map((option) => (
              <label key={option.value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="sr-only"
                />
                <div
                  className={`
                  px-4 md:px-6 py-3 rounded-md font-medium text-sm transition-all duration-200
                  ${
                    mode === option.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : `${themeClasses.textSecondary} ${themeClasses.hoverBg} hover:text-blue-600`
                  }
                `}
                >
                  <span className="mr-2">{option.icon}</span>
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.icon}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Camera/Upload */}
          <div className="space-y-6">
            {/* Webcam Display */}
            {(mode === "realtime" || mode === "capture") && (
              <div
                className={`${themeClasses.cardBg} rounded-xl shadow-lg border ${themeClasses.cardBorder} overflow-hidden`}
              >
                <div className={`p-4 border-b ${themeClasses.cardBorder}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} flex items-center`}>
                    <span className="mr-2">📹</span>
                    {mode === "realtime" ? "Live Camera Feed" : "Camera Preview"}
                  </h3>
                </div>
                <div className="relative bg-black">
                  {capturedImage && showRecapture ? (
                    <div className="relative">
                      <img
                        src={capturedImage || "/placeholder.svg"}
                        alt="Captured"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={handleRecapture}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-lg"
                        >
                          📸 Recapture
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={640}
                        height={480}
                        videoConstraints={{ facingMode: "environment" }}
                        className="w-full h-auto"
                      />
                      {mode === "realtime" && (
                        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 px-3 py-2 rounded-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-sm font-medium">LIVE</span>
                        </div>
                      )}
                      {/* Countdown Display for Realtime Mode */}
                      {mode === "realtime" && isCountdownActive && (
                        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="relative w-8 h-8">
                              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                                <circle
                                  cx="16"
                                  cy="16"
                                  r="14"
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="2"
                                  fill="none"
                                />
                                <circle
                                  cx="16"
                                  cy="16"
                                  r="14"
                                  stroke="white"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeDasharray={`${(countdown / 15) * 87.96} 87.96`}
                                  className="transition-all duration-1000 ease-linear"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold">{countdown}</span>
                              </div>
                            </div>
                            <span className="text-sm font-medium">Next capture</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Upload Section */}
            {mode === "upload" && (
              <div className={`${themeClasses.cardBg} rounded-xl shadow-lg border ${themeClasses.cardBorder} p-6`}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">📁</span>
                  </div>
                  <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-2`}>Upload Your Image</h3>
                  <p className={themeClasses.textSecondary}>Choose an image file to analyze</p>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                    ${
                      uploadedFile
                        ? "border-green-400 bg-green-50"
                        : `${themeClasses.inputBorder} hover:border-blue-400 ${darkMode ? "hover:bg-gray-800" : "hover:bg-blue-50"}`
                    }
                  `}
                  >
                    <span className="text-3xl mb-4 block">{uploadedFile ? "✅" : "⬆️"}</span>
                    <p className={`${themeClasses.textPrimary} font-medium`}>
                      {uploadedFile ? uploadedFile.name : "Click to select or drag & drop"}
                    </p>
                    <p className={`${themeClasses.textMuted} text-sm mt-2`}>
                      {uploadedFile ? "File ready for analysis" : "PNG, JPG, GIF up to 10MB"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (uploadedFile) sendImageForDescription(uploadedFile)
                      else alert("Please select an image first.")
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!uploadedFile || loadingDescription}
                  >
                    {loadingDescription ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Analyzing...
                      </div>
                    ) : (
                      "🔍 Analyze Image"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Capture Photo Section */}
            {mode === "capture" && !showRecapture && (
              <div className={`${themeClasses.cardBg} rounded-xl shadow-lg border ${themeClasses.cardBorder} p-6`}>
                <button
                  onClick={captureAndDescribe}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingDescription}
                >
                  {loadingDescription ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Capturing...
                    </div>
                  ) : (
                    "📸 Capture & Analyze"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Description Display */}
            <div className={`${themeClasses.cardBg} rounded-xl shadow-lg border ${themeClasses.cardBorder}`}>
              <div className={`p-6 border-b ${themeClasses.cardBorder}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">🔍</span>
                    </div>
                    <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>AI Analysis Results</h3>
                  </div>
                  <button
                    onClick={sendImageForDetailedDescription}
                    className={`${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-600 hover:bg-gray-700"} text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                    disabled={!lastDescribedImage || loadingDetailed}
                  >
                    {loadingDetailed ? (
                      <div className="flex items-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading...
                      </div>
                    ) : (
                      "📋 Detailed Analysis"
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-blue-700 font-medium mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Basic Description
                  </h4>
                  <div className={`${themeClasses.sectionBg} rounded-lg p-4 border ${themeClasses.sectionBorder}`}>
                    {loadingDescription && !description ? (
                      <div className={`flex items-center ${themeClasses.textMuted}`}>
                        <div
                          className={`w-4 h-4 border-2 ${darkMode ? "border-gray-400" : "border-gray-400"} border-t-transparent rounded-full animate-spin mr-2`}
                        ></div>
                        Analyzing image...
                      </div>
                    ) : (
                      <p className={`${themeClasses.textPrimary} leading-relaxed min-h-[60px]`}>
                        {description || "No description available yet. Capture or upload an image to get started."}
                      </p>
                    )}
                  </div>
                </div>

                {detailedDescription && (
                  <div>
                    <h4
                      className={`${darkMode ? "text-gray-300" : "text-gray-700"} font-medium mb-3 flex items-center`}
                    >
                      <span className={`w-2 h-2 ${darkMode ? "bg-gray-400" : "bg-gray-500"} rounded-full mr-2`}></span>
                      Detailed Analysis
                    </h4>
                    <div className={`${themeClasses.sectionBg} rounded-lg p-4 border ${themeClasses.sectionBorder}`}>
                      <p className={`${themeClasses.textPrimary} leading-relaxed`}>{detailedDescription}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Question & Answer Section */}
            <div className={`${themeClasses.cardBg} rounded-xl shadow-lg border ${themeClasses.cardBorder} p-6`}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-lg">💬</span>
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Ask About the Image</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-green-700 font-medium mb-2">Your Question</label>
                  <textarea
                    rows={3}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like to know about this image?"
                    className={`w-full ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg p-4 ${themeClasses.textPrimary} ${darkMode ? "placeholder-gray-400" : "placeholder-gray-500"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200`}
                    disabled={loadingQuestion}
                  />
                </div>

                <button
                  onClick={sendImageQuestion}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingQuestion || !question.trim()}
                >
                  {loadingQuestion ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Getting Answer...
                    </div>
                  ) : (
                    "🤖 Get AI Answer"
                  )}
                </button>

                {answer && (
                  <div>
                    <h4 className="text-green-700 font-medium mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      AI Response
                    </h4>
                    <div
                      className={`${darkMode ? "bg-green-900/30 border-green-700" : "bg-green-50 border-green-200"} rounded-lg p-4 border`}
                    >
                      <p className={`${themeClasses.textPrimary} leading-relaxed`}>{answer}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator for Realtime Mode
        {mode === "realtime" && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg border border-red-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Auto-capturing every 15s</span>
            </div>
          </div>
        )} */}
      </main>
    </div>
  )
}
