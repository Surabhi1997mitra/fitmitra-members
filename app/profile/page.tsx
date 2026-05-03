'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Sun, Moon, ChevronLeft, ChevronRight, Home, Play, User, Camera, Loader, UtensilsCrossed } from 'lucide-react'

interface ProfileData {
  // Step 1: Personal Details
  full_name?: string
  age?: number
  gender?: string
  date_of_birth?: string
  phone?: string
  email?: string
  city?: string
  state?: string
  pincode?: string

  // Step 2: Body Stats
  height?: number
  weight?: number
  target_weight?: number
  body_type?: string

  // Step 3: Goals
  primary_goal?: string
  secondary_goal?: string
  goal_timeline?: string
  motivation?: string

  // Step 4: Health & Medical
  medical_conditions?: string
  injuries?: string
  medications?: string
  surgeries?: string
  blood_reports?: string

  // Step 5: Fitness Background
  activity_level?: string
  fitness_experience?: string
  workout_type?: string
  workout_days?: number
  workout_duration?: string
  equipment_available?: string

  // Step 6: Diet & Nutrition
  dietary_preference?: string
  allergies?: string
  meals_per_day?: string
  water_intake?: string
  supplements?: string
  alcohol_consumption?: string

  // Step 7: Lifestyle & Recovery
  occupation?: string
  work_hours?: string
  sleep_hours?: string
  stress_level?: string
  smoking_status?: string

  // Step 8: Body Measurements
  chest_measurement?: number
  waist_measurement?: number
  hips_measurement?: number
  arms_measurement?: number
  thighs_measurement?: number

  // Step 9: Tracking Preferences
  tracking_method?: string
  checkin_frequency?: string
  additional_notes?: string

  completed?: boolean
}

const STEPS = [
  'Personal Details',
  'Body Stats',
  'Goals',
  'Health & Medical',
  'Fitness Background',
  'Diet & Nutrition',
  'Lifestyle & Recovery',
  'Body Measurements',
  'Tracking Preferences',
]

const LABEL_MAP: { [key: string]: string } = {
  full_name: 'Full Name',
  age: 'Age',
  gender: 'Gender',
  date_of_birth: 'Date of Birth',
  phone: 'Phone',
  email: 'Email',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  height: 'Height (cm)',
  weight: 'Weight (kg)',
  target_weight: 'Target Weight (kg)',
  body_type: 'Body Type',
  primary_goal: 'Primary Goal',
  secondary_goal: 'Secondary Goal',
  goal_timeline: 'Goal Timeline',
  motivation: 'Motivation',
  medical_conditions: 'Medical Conditions',
  injuries: 'Injuries',
  medications: 'Medications',
  surgeries: 'Surgeries',
  blood_reports: 'Blood Reports',
  activity_level: 'Activity Level',
  fitness_experience: 'Fitness Experience',
  workout_type: 'Workout Type',
  workout_days: 'Workout Days per Week',
  workout_duration: 'Workout Duration',
  equipment_available: 'Equipment Available',
  dietary_preference: 'Dietary Preference',
  allergies: 'Allergies',
  meals_per_day: 'Meals per Day',
  water_intake: 'Water Intake',
  supplements: 'Supplements',
  alcohol_consumption: 'Alcohol Consumption',
  occupation: 'Occupation',
  work_hours: 'Work Hours per Day',
  sleep_hours: 'Sleep Hours per Night',
  stress_level: 'Stress Level',
  smoking_status: 'Smoking Status',
  chest_measurement: 'Chest (cm)',
  waist_measurement: 'Waist (cm)',
  hips_measurement: 'Hips (cm)',
  arms_measurement: 'Arms (cm)',
  thighs_measurement: 'Thighs (cm)',
  tracking_method: 'Tracking Method',
  checkin_frequency: 'Check-in Frequency',
  additional_notes: 'Additional Notes',
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<ProfileData>({})
  const [existingProfile, setExistingProfile] = useState<ProfileData | null>(null)

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [progressPhotos, setProgressPhotos] = useState<{ id: string; url: string; created_at: string }[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUserId(session.user.id)
    setUserEmail(session.user.email || null)
    await fetchProfile(session.user.id)
    setLoading(false)
  }

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('client_profile')
      .select('*')
      .eq('user_id', userId)

    if (!error && data && data.length > 0) {
      const profile = data[0]
      setExistingProfile(profile)
      setFormData(profile)
      setProfileCompleted(profile.completed)
    }

    // Fetch avatar and progress photos
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profileData?.avatar_url) {
      setAvatarUrl(profileData.avatar_url)
    }

    // Fetch progress photos
    const { data: photosData } = await supabase
      .from('progress_photos')
      .select('id, url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (photosData) {
      setProgressPhotos(photosData)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    if (!userId) return

    setSubmitting(true)
    setError('')

    try {
      const profileData = {
        user_id: userId,
        ...formData,
        completed: true,
      }

      console.log('Submitting profile data:', { userId, hasExisting: !!existingProfile })

      if (existingProfile) {
        console.log('Updating existing profile...')
        const { error: updateError } = await supabase
          .from('client_profile')
          .update(profileData)
          .eq('user_id', userId)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
        console.log('✓ Profile updated')
      } else {
        console.log('Inserting new profile...')
        const { error: insertError } = await supabase
          .from('client_profile')
          .insert([profileData])

        if (insertError) {
          console.error('Insert error:', insertError)
          throw insertError
        }
        console.log('✓ Profile inserted')
      }

      setSuccessMessage('Profile saved! Your coach will review your details soon.')
      setProfileCompleted(true)
      setExistingProfile(profileData)
      setSubmitting(false)

      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save profile'
      console.error('Submit error:', errorMsg)
      setError(errorMsg)
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAvatarUpload = async (file: File) => {
    if (!userId) return

    setAvatarUploading(true)
    try {
      const fileName = `${userId}/avatar.jpg`
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)

      setAvatarUrl(publicUrl)
      setSuccessMessage('Avatar updated!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleProgressPhotosUpload = async (files: FileList) => {
    if (!userId || files.length === 0) return

    setUploadingPhotos(true)
    try {
      const uploadedPhotos: { id: string; url: string; created_at: string }[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${userId}/${Date.now()}-${i}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('progress-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('progress-photos').getPublicUrl(fileName)

        const { data: insertData, error: insertError } = await supabase
          .from('progress_photos')
          .insert({ user_id: userId, url: publicUrl })
          .select()
          .single()

        if (insertError) throw insertError

        uploadedPhotos.push({
          id: insertData.id,
          url: publicUrl,
          created_at: insertData.created_at,
        })
      }

      setProgressPhotos((prev) => [...uploadedPhotos, ...prev])
      setSuccessMessage(`${uploadedPhotos.length} photo(s) uploaded!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos')
    } finally {
      setUploadingPhotos(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--color-bg-primary)', borderBottomColor: 'var(--color-border)', borderBottomWidth: '1px' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold">
              <span style={{ color: 'var(--color-text-primary)' }}>Fit</span>
              <span style={{ color: 'var(--color-accent)' }}>Mitra</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 transition p-2 rounded-lg"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Avatar Section */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold overflow-hidden"
              style={{
                backgroundColor: avatarUrl ? 'transparent' : 'var(--color-accent)',
                color: 'white',
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : userEmail ? (
                userEmail[0].toUpperCase()
              ) : (
                '?'
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition"
              style={{ backgroundColor: 'var(--color-accent)' }}
              title="Upload photo"
            >
              <Camera size={16} color="white" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleAvatarUpload(e.target.files[0])}
                className="hidden"
                disabled={avatarUploading}
              />
            </label>
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <Loader size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {profileCompleted ? (
          /* STATE 2: Completed Profile */
          <div>
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(193, 123, 138, 0.15)' }}>
              <p style={{ color: 'var(--color-accent)' }} className="text-center font-medium">
                Your profile has been submitted. Your coach will be in touch soon.
              </p>
            </div>

            {/* Profile Sections */}
            {[
              { title: 'Personal Details', fields: ['full_name', 'age', 'gender', 'date_of_birth', 'phone', 'email', 'city', 'state', 'pincode'] },
              { title: 'Body Stats', fields: ['height', 'weight', 'target_weight', 'body_type'] },
              { title: 'Goals', fields: ['primary_goal', 'secondary_goal', 'goal_timeline', 'motivation'] },
              { title: 'Health & Medical', fields: ['medical_conditions', 'injuries', 'medications', 'surgeries', 'blood_reports'] },
              { title: 'Fitness Background', fields: ['activity_level', 'fitness_experience', 'workout_type', 'workout_days', 'workout_duration', 'equipment_available'] },
              { title: 'Diet & Nutrition', fields: ['dietary_preference', 'allergies', 'meals_per_day', 'water_intake', 'supplements', 'alcohol_consumption'] },
              { title: 'Lifestyle & Recovery', fields: ['occupation', 'work_hours', 'sleep_hours', 'stress_level', 'smoking_status'] },
              { title: 'Body Measurements', fields: ['chest_measurement', 'waist_measurement', 'hips_measurement', 'arms_measurement', 'thighs_measurement'] },
              { title: 'Tracking Preferences', fields: ['tracking_method', 'checkin_frequency', 'additional_notes'] },
            ].map((section) => (
              <div key={section.title} className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <h3 className="font-bold mb-3 text-lg" style={{ color: 'var(--color-accent)' }}>
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.fields.map((field) => {
                    const value = formData[field as keyof ProfileData]
                    return value ? (
                      <div key={field}>
                        <p style={{ color: 'var(--color-text-muted)' }} className="text-xs uppercase tracking-wide">
                          {LABEL_MAP[field] || field}
                        </p>
                        <p style={{ color: 'var(--color-text-primary)' }} className="font-medium mt-1">
                          {String(value)}
                        </p>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            ))}

            {/* Progress Photos Section */}
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <h3 className="font-bold mb-4 text-lg" style={{ color: 'var(--color-accent)' }}>
                Progress Photos
              </h3>

              {/* Upload Area */}
              <div className="mb-6">
                <label
                  className="block p-4 rounded-lg border-2 border-dashed text-center cursor-pointer transition"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleProgressPhotosUpload(e.target.files)}
                    className="hidden"
                    disabled={uploadingPhotos}
                  />
                  <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                    {uploadingPhotos ? 'Uploading...' : 'Click to upload progress photos'}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mt-1">
                    or drag and drop
                  </p>
                </label>
              </div>

              {/* Photos Grid */}
              {progressPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {progressPhotos.map((photo) => (
                    <div key={photo.id} className="flex flex-col">
                      <img
                        src={photo.url}
                        alt="Progress"
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1 text-center">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {progressPhotos.length === 0 && !uploadingPhotos && (
                <p style={{ color: 'var(--color-text-secondary)' }} className="text-center py-4">
                  No photos uploaded yet
                </p>
              )}
            </div>
          </div>
        ) : (
          /* STATE 1: Onboarding Form */
          <div>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Step {currentStep + 1} of {STEPS.length}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                  {STEPS[currentStep]}
                </p>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                    backgroundColor: 'var(--color-accent)',
                  }}
                />
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              {currentStep === 0 && <Step1 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 1 && <Step2 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 2 && <Step3 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 3 && <Step4 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 4 && <Step5 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 5 && <Step6 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 6 && <Step7 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 7 && <Step8 formData={formData} handleInputChange={handleInputChange} />}
              {currentStep === 8 && <Step9 formData={formData} handleInputChange={handleInputChange} />}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(193, 123, 138, 0.15)', borderColor: 'var(--color-accent)', borderWidth: '1px' }}>
                <p style={{ color: 'var(--color-accent)' }} className="text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-3 rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: `1px solid var(--color-border)`,
                }}
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              {currentStep === STEPS.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-lg transition font-semibold disabled:cursor-not-allowed text-white"
                  style={{
                    backgroundColor: submitting ? 'rgba(193, 123, 138, 0.5)' : 'var(--color-accent)',
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                  }}
                >
                  {submitting ? 'Saving...' : 'Complete Profile'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                  }}
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="p-6 rounded-xl max-w-sm w-full"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Are you sure you want to logout?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg transition"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  borderWidth: '1px',
                  color: 'var(--color-text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0" style={{ backgroundColor: 'var(--color-bg-secondary)', borderTopColor: 'var(--color-border)', borderTopWidth: '1px' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-around">
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Home size={24} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link
            href="/workouts"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Play size={24} />
            <span className="text-xs mt-1 font-medium">Workouts</span>
          </Link>
          <Link
            href="/recipes"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <UtensilsCrossed size={24} />
            <span className="text-xs mt-1 font-medium">Recipes</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-accent)' }}
          >
            <User size={24} />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

// Step Components
function Step1({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Personal Details</h3>
      <Input label="Full Name" value={formData.full_name || ''} onChange={(v) => handleInputChange('full_name', v)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Age" type="number" value={formData.age || ''} onChange={(v) => handleInputChange('age', v ? parseInt(v) : null)} />
        <Select label="Gender" value={formData.gender || ''} options={['Male', 'Female', 'Other']} onChange={(v) => handleInputChange('gender', v)} />
      </div>
      <Input label="Date of Birth" type="date" value={formData.date_of_birth || ''} onChange={(v) => handleInputChange('date_of_birth', v)} />
      <Input label="Phone" type="tel" value={formData.phone || ''} onChange={(v) => handleInputChange('phone', v)} />
      <Input label="Email" type="email" value={formData.email || ''} onChange={(v) => handleInputChange('email', v)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City" value={formData.city || ''} onChange={(v) => handleInputChange('city', v)} />
        <Input label="State" value={formData.state || ''} onChange={(v) => handleInputChange('state', v)} />
      </div>
      <Input label="Pincode" value={formData.pincode || ''} onChange={(v) => handleInputChange('pincode', v)} />
    </div>
  )
}

function Step2({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Body Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Height (cm)" type="number" value={formData.height || ''} onChange={(v) => handleInputChange('height', v ? parseFloat(v) : null)} />
        <Input label="Weight (kg)" type="number" value={formData.weight || ''} onChange={(v) => handleInputChange('weight', v ? parseFloat(v) : null)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Target Weight (kg)" type="number" value={formData.target_weight || ''} onChange={(v) => handleInputChange('target_weight', v ? parseFloat(v) : null)} />
        <Select label="Body Type" value={formData.body_type || ''} options={['Ectomorph', 'Mesomorph', 'Endomorph', 'Not Sure']} onChange={(v) => handleInputChange('body_type', v)} />
      </div>
    </div>
  )
}

function Step3({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Goals</h3>
      <Select label="Primary Goal" value={formData.primary_goal || ''} options={['Weight Loss', 'Muscle Gain', 'Body Recomposition', 'Improve Stamina', 'General Fitness']} onChange={(v) => handleInputChange('primary_goal', v)} />
      <Select label="Secondary Goal" value={formData.secondary_goal || ''} options={['Weight Loss', 'Muscle Gain', 'Body Recomposition', 'Improve Stamina', 'General Fitness', 'None']} onChange={(v) => handleInputChange('secondary_goal', v)} />
      <Select label="Goal Timeline" value={formData.goal_timeline || ''} options={['1 month', '3 months', '6 months', '1 year', 'Long-term']} onChange={(v) => handleInputChange('goal_timeline', v)} />
      <TextArea label="Motivation" placeholder="What motivates you?" value={formData.motivation || ''} onChange={(v) => handleInputChange('motivation', v)} />
    </div>
  )
}

function Step4({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Health & Medical</h3>
      <Select label="Medical Conditions" value={formData.medical_conditions || ''} options={['None', 'Diabetes Type 1', 'Diabetes Type 2', 'Thyroid', 'PCOS', 'Hypertension', 'Other']} onChange={(v) => handleInputChange('medical_conditions', v)} />
      <Select label="Injuries" value={formData.injuries || ''} options={['None', 'Knee', 'Back', 'Shoulder', 'Hip', 'Other']} onChange={(v) => handleInputChange('injuries', v)} />
      <TextArea label="Current Medications (Optional)" value={formData.medications || ''} onChange={(v) => handleInputChange('medications', v)} />
      <TextArea label="Previous Surgeries (Optional)" value={formData.surgeries || ''} onChange={(v) => handleInputChange('surgeries', v)} />
      <Select label="Recent Blood Reports" value={formData.blood_reports || ''} options={['Yes', 'No']} onChange={(v) => handleInputChange('blood_reports', v)} />
    </div>
  )
}

function Step5({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Fitness Background</h3>
      <Select label="Activity Level" value={formData.activity_level || ''} options={['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active']} onChange={(v) => handleInputChange('activity_level', v)} />
      <Select label="Fitness Experience" value={formData.fitness_experience || ''} options={['Beginner', 'Intermediate', 'Advanced']} onChange={(v) => handleInputChange('fitness_experience', v)} />
      <Input label="Workout Type" value={formData.workout_type || ''} onChange={(v) => handleInputChange('workout_type', v)} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Workout Days/Week" value={String(formData.workout_days || '')} options={['2', '3', '4', '5', '6', '7']} onChange={(v) => handleInputChange('workout_days', v ? parseInt(v) : null)} />
        <Select label="Duration/Session" value={formData.workout_duration || ''} options={['30 min', '45 min', '60 min', '90 min']} onChange={(v) => handleInputChange('workout_duration', v)} />
      </div>
      <Select label="Equipment Available" value={formData.equipment_available || ''} options={['Full Gym', 'Home Dumbbells', 'Resistance Bands', 'Bodyweight Only']} onChange={(v) => handleInputChange('equipment_available', v)} />
    </div>
  )
}

function Step6({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Diet & Nutrition</h3>
      <Select label="Dietary Preference" value={formData.dietary_preference || ''} options={['Non-Vegetarian', 'Vegetarian', 'Eggetarian', 'Vegan', 'Jain']} onChange={(v) => handleInputChange('dietary_preference', v)} />
      <Select label="Allergies" value={formData.allergies || ''} options={['None', 'Lactose', 'Gluten', 'Nut', 'Other']} onChange={(v) => handleInputChange('allergies', v)} />
      <Select label="Meals per Day" value={formData.meals_per_day || ''} options={['1-2', '3', '4', '5', '6+']} onChange={(v) => handleInputChange('meals_per_day', v)} />
      <Select label="Water Intake" value={formData.water_intake || ''} options={['Less than 1L', '1-2L', '2-3L', '3L+']} onChange={(v) => handleInputChange('water_intake', v)} />
      <Input label="Supplements (Optional)" value={formData.supplements || ''} onChange={(v) => handleInputChange('supplements', v)} />
      <Select label="Alcohol Consumption" value={formData.alcohol_consumption || ''} options={['Never', 'Occasionally', 'Weekends', 'Regular']} onChange={(v) => handleInputChange('alcohol_consumption', v)} />
    </div>
  )
}

function Step7({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Lifestyle & Recovery</h3>
      <Select label="Occupation" value={formData.occupation || ''} options={['Student', 'Desk Job', 'Field Job', 'Homemaker', 'Business Owner', 'Freelancer']} onChange={(v) => handleInputChange('occupation', v)} />
      <Select label="Work Hours/Day" value={formData.work_hours || ''} options={['Less than 6', '6-8', '8-10', '10+']} onChange={(v) => handleInputChange('work_hours', v)} />
      <Select label="Sleep Hours/Night" value={formData.sleep_hours || ''} options={['Less than 5', '5-6', '6-7', '7-8', '8+']} onChange={(v) => handleInputChange('sleep_hours', v)} />
      <Select label="Stress Level" value={formData.stress_level || ''} options={['Low', 'Moderate', 'High', 'Very High']} onChange={(v) => handleInputChange('stress_level', v)} />
      <Select label="Smoking Status" value={formData.smoking_status || ''} options={['Non-smoker', 'Occasional', 'Regular']} onChange={(v) => handleInputChange('smoking_status', v)} />
    </div>
  )
}

function Step8({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Body Measurements (Optional)</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Chest (cm)" type="number" value={formData.chest_measurement || ''} onChange={(v) => handleInputChange('chest_measurement', v ? parseFloat(v) : null)} />
        <Input label="Waist (cm)" type="number" value={formData.waist_measurement || ''} onChange={(v) => handleInputChange('waist_measurement', v ? parseFloat(v) : null)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Hips (cm)" type="number" value={formData.hips_measurement || ''} onChange={(v) => handleInputChange('hips_measurement', v ? parseFloat(v) : null)} />
        <Input label="Arms (cm)" type="number" value={formData.arms_measurement || ''} onChange={(v) => handleInputChange('arms_measurement', v ? parseFloat(v) : null)} />
      </div>
      <Input label="Thighs (cm)" type="number" value={formData.thighs_measurement || ''} onChange={(v) => handleInputChange('thighs_measurement', v ? parseFloat(v) : null)} />
    </div>
  )
}

function Step9({ formData, handleInputChange }: { formData: ProfileData; handleInputChange: (field: keyof ProfileData, value: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Tracking Preferences</h3>
      <Select label="Tracking Method" value={formData.tracking_method || ''} options={['WhatsApp', 'Email', 'In-person']} onChange={(v) => handleInputChange('tracking_method', v)} />
      <Select label="Check-in Frequency" value={formData.checkin_frequency || ''} options={['Daily', 'Weekly', 'Bi-weekly', 'Monthly']} onChange={(v) => handleInputChange('checkin_frequency', v)} />
      <TextArea label="Additional Notes (Optional)" placeholder="Anything else we should know?" value={formData.additional_notes || ''} onChange={(v) => handleInputChange('additional_notes', v)} />
    </div>
  )
}

// Form Component Helpers
function Input({ label, type = 'text', value, onChange }: { label: string; type?: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          color: 'var(--color-text-primary)',
        }}
      />
    </div>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          color: 'var(--color-text-primary)',
        }}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextArea({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          color: 'var(--color-text-primary)',
        }}
      />
    </div>
  )
}
