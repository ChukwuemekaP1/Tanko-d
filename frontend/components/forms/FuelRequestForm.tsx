'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle2, Fuel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useOraclePrice } from '@/hooks/useOraclePrice'

interface FuelRequestFormProps {
  driverPubKey: string
  onSuccess: () => void
  onCancel: () => void
}

interface FuelType {
  id: string
  name: string
  label: string
}

const FUEL_TYPES: FuelType[] = [
  { id: 'diesel', name: 'Diesel', label: 'Diesel' },
  { id: 'premium', name: 'Premium', label: 'Premium Gasoline' },
  { id: 'magna', name: 'Magna', label: 'Magna (Regular)' },
]

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001'

/**
 * FuelRequestForm Component
 *
 * Allows drivers to request fuel with real-time oracle pricing
 * Features:
 * - Real-time fuel price display from Oracle backend
 * - Automatic cost calculation (liters × price per liter)
 * - Manager selection
 * - Fuel type selection
 */
export default function FuelRequestForm({
  driverPubKey,
  onSuccess,
  onCancel,
}: FuelRequestFormProps) {
  const { prices, loading: pricesLoading, error: pricesError, getPricePerLiter } = useOraclePrice()

  // Form state
  const [liters, setLiters] = useState('')
  const [selectedFuelType, setSelectedFuelType] = useState('Diesel')
  const [managerPubKey, setManagerPubKey] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Validation state
  const [touched, setTouched] = useState({ liters: false, manager: false })
  const [errors, setErrors] = useState({ liters: '', manager: '' })

  // Calculate the estimated fuel cost based on oracle price
  const pricePerLiter = getPricePerLiter(selectedFuelType)
  const litersNum = parseFloat(liters) || 0
  const estimatedCost = litersNum > 0 && pricePerLiter ? litersNum * pricePerLiter : 0

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const validateLiters = (value: string) => {
    if (!value) return 'Liters is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Must be a number'
    if (num <= 0) return 'Must be greater than 0'
    if (num > 10000) return 'Value too large'
    return ''
  }

  const validateManager = (value: string) => {
    if (!value) return 'Manager is required'
    if (value.length !== 56) return `Must be exactly 56 characters (currently ${value.length})`
    if (!value.startsWith('G')) return 'Must start with the letter G'
    if (!/^G[A-Z2-7]{55}$/.test(value)) {
      return 'Invalid format – only uppercase letters A-Z and digits 2-7 are allowed'
    }
    return ''
  }

  const handleLitersChange = (value: string) => {
    setLiters(value)
    if (touched.liters) {
      setErrors((e) => ({ ...e, liters: validateLiters(value) }))
    }
  }

  const handleManagerChange = (value: string) => {
    const upper = value.toUpperCase()
    setManagerPubKey(upper)
    if (touched.manager) {
      setErrors((e) => ({ ...e, manager: validateManager(upper) }))
    }
  }

  const handleLitersBlur = () => {
    setTouched((t) => ({ ...t, liters: true }))
    setErrors((e) => ({ ...e, liters: validateLiters(liters) }))
  }

  const handleManagerBlur = () => {
    setTouched((t) => ({ ...t, manager: true }))
    setErrors((e) => ({ ...e, manager: validateManager(managerPubKey) }))
  }

  const isValid =
    !validateLiters(liters) &&
    !validateManager(managerPubKey) &&
    estimatedCost > 0 &&
    !submitting &&
    !pricesLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Force touch for validation display
    setTouched({ liters: true, manager: true })
    const litersErr = validateLiters(liters)
    const managerErr = validateManager(managerPubKey)

    setErrors({ liters: litersErr, manager: managerErr })
    if (litersErr || managerErr) return

    if (!pricePerLiter) {
      toast.error('Oracle price not available')
      return
    }

    setSubmitting(true)

    try {
      // Get the signed price from oracle for this fuel type
      const priceResponse = await fetch(`${BACKEND}/api/v1/oracle/prices/${selectedFuelType}`)
      if (!priceResponse.ok) {
        throw new Error('Failed to fetch current price')
      }
      const priceData = await priceResponse.json()
      const signedPrice = priceData.data?.price

      // Create fuel request with oracle price
      const response = await fetch(`${BACKEND}/api/v1/funds/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverPubKey,
          managerPubKey,
          liters: parseFloat(liters),
          amount: estimatedCost,
          description: description || undefined,
          fuelType: selectedFuelType,
          oraclePrice: signedPrice, // Include oracle price for verification
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create fuel request')
      }

      const data = await response.json()
      toast.success('Fuel request created successfully!')
      onSuccess()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      console.error('Fuel request error:', error)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (pricesError) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Cannot Load Prices</p>
            <p className="text-xs text-red-700">{pricesError}</p>
          </div>
        </div>
        <Button onClick={onCancel} className="w-full mt-4" variant="outline">
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Fuel className="h-6 w-6" />
            Request Fuel
          </h2>
          <p className="text-sm text-gray-600 mt-1">Enter fuel details with live oracle pricing</p>
        </div>

        {/* Fuel Type Selection */}
        <div>
          <Label htmlFor="fuelType" className="text-base font-medium">
            Fuel Type
          </Label>
          <select
            id="fuelType"
            value={selectedFuelType}
            onChange={(e) => setSelectedFuelType(e.target.value)}
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FUEL_TYPES.map((type) => (
              <option key={type.id} value={type.name}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Current Price Display */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-900">Current Price (Oracle):</span>
            {pricesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : pricePerLiter ? (
              <span className="text-lg font-bold text-blue-900">${pricePerLiter.toFixed(2)}/L</span>
            ) : (
              <span className="text-sm text-blue-700">Price unavailable</span>
            )}
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Last updated: {prices && new Date(prices[0]?.payload.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Liters Input */}
        <div>
          <Label htmlFor="liters" className="text-base font-medium">
            Liters <span className="text-red-500">*</span>
          </Label>
          <Input
            id="liters"
            type="number"
            placeholder="Enter number of liters (e.g., 50)"
            value={liters}
            onChange={(e) => handleLitersChange(e.target.value)}
            onBlur={handleLitersBlur}
            disabled={submitting || pricesLoading}
            className="mt-2"
            step="0.01"
            min="0"
            max="10000"
          />
          {touched.liters && errors.liters && (
            <p className="text-sm text-red-500 mt-1">{errors.liters}</p>
          )}
        </div>

        {/* Estimated Cost Display */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-900 mb-1">Estimated Cost:</p>
          <p className="text-3xl font-bold text-green-900">
            {estimatedCost > 0 ? formatCurrency(estimatedCost) : '$0.00'}
          </p>
          <p className="text-xs text-green-700 mt-1">
            {litersNum} liters × ${pricePerLiter?.toFixed(2)}/L
          </p>
        </div>

        {/* Manager Public Key */}
        <div>
          <Label htmlFor="manager" className="text-base font-medium">
            Manager Public Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="manager"
            type="text"
            placeholder="Enter manager's Stellar public key (starting with G)"
            value={managerPubKey}
            onChange={(e) => handleManagerChange(e.target.value)}
            onBlur={handleManagerBlur}
            disabled={submitting}
            className="mt-2 font-mono text-sm"
          />
          {touched.manager && errors.manager && (
            <p className="text-sm text-red-500 mt-1">{errors.manager}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-base font-medium">
            Description (Optional)
          </Label>
          <textarea
            id="description"
            placeholder="Add any notes about this fuel request..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Error Display */}
        {pricesError && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Prices Not Available</p>
              <p className="text-xs">{pricesError}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Request Fuel
              </>
            )}
          </Button>
        </div>

        {/* Oracle Status Indicator */}
        <div className="text-xs text-gray-500 text-center">
          {pricesLoading ? (
            <div className="flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading oracle prices...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Oracle prices verified
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
