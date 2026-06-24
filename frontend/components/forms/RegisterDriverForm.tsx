"use client"

import { useState } from "react"
import { Loader2, Key, User, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001"

/** Validates a Stellar Public Key: 56 chars, starts with G, base32. */
function validateStellarKey(key: string): string | null {
  if (!key) return "Stellar Public Key is required"
  if (key.length !== 56) return `Must be exactly 56 characters (currently ${key.length})`
  if (!key.startsWith("G")) return "Must start with the letter G"
  if (!/^G[A-Z2-7]{55}$/.test(key))
    return "Invalid format – only uppercase letters A-Z and digits 2-7 are allowed"
  return null
}

interface RegisterDriverFormProps {
  managerPubKey: string
  onSuccess: () => void
  onCancel: () => void
}

export default function RegisterDriverForm({
  managerPubKey,
  onSuccess,
  onCancel,
}: RegisterDriverFormProps) {
  const [name, setName] = useState("")
  const [stellarPubKey, setStellarPubKey] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Validation states
  const [nameError, setNameError] = useState<string | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [touched, setTouched] = useState({ name: false, key: false })

  const handleNameChange = (value: string) => {
    setName(value)
    if (touched.name) {
      setNameError(value.trim() ? null : "Driver name is required")
    }
  }

  const handleKeyChange = (value: string) => {
    const upper = value.toUpperCase()
    setStellarPubKey(upper)
    if (touched.key) {
      setKeyError(validateStellarKey(upper))
    }
  }

  const handleNameBlur = () => {
    setTouched((t) => ({ ...t, name: true }))
    setNameError(name.trim() ? null : "Driver name is required")
  }

  const handleKeyBlur = () => {
    setTouched((t) => ({ ...t, key: true }))
    setKeyError(validateStellarKey(stellarPubKey))
  }

  const isValid = name.trim().length > 0 && validateStellarKey(stellarPubKey) === null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Force‑touch for final validation display
    setTouched({ name: true, key: true })
    const nErr = name.trim() ? null : "Driver name is required"
    const kErr = validateStellarKey(stellarPubKey)
    setNameError(nErr)
    setKeyError(kErr)
    if (nErr || kErr) return

    setSubmitting(true)
    try {
      const res = await fetch(`${BACKEND}/api/v1/users/register-driver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-stellar-pubkey": managerPubKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          stellarPubKey,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("Driver registered successfully", {
          description: `${name.trim()} has been added to your fleet.`,
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
        onSuccess()
      } else {
        toast.error("Failed to register driver", {
          description: data.error || "Unknown error",
        })
      }
    } catch (err) {
      toast.error("Connection error", {
        description: "Could not reach the server. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Driver Name */}
      <div className="space-y-2">
        <Label htmlFor="driver-name" className="flex items-center gap-1.5 text-sm font-medium">
          <User className="h-4 w-4 text-muted-foreground" />
          Driver Name
        </Label>
        <Input
          id="driver-name"
          placeholder="e.g. Carlos Hernández"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={handleNameBlur}
          disabled={submitting}
          className={nameError && touched.name ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {nameError && touched.name && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {nameError}
          </p>
        )}
      </div>

      {/* Stellar Public Key */}
      <div className="space-y-2">
        <Label htmlFor="driver-stellar-key" className="flex items-center gap-1.5 text-sm font-medium">
          <Key className="h-4 w-4 text-muted-foreground" />
          Stellar Public Key
        </Label>
        <Input
          id="driver-stellar-key"
          placeholder="G..."
          value={stellarPubKey}
          onChange={(e) => handleKeyChange(e.target.value)}
          onBlur={handleKeyBlur}
          disabled={submitting}
          maxLength={56}
          className={`font-mono text-sm ${
            keyError && touched.key ? "border-destructive focus-visible:ring-destructive" : ""
          }`}
        />
        <div className="flex items-center justify-between">
          {keyError && touched.key ? (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              {keyError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              56-character Stellar address starting with G
            </p>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {stellarPubKey.length}/56
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || !isValid}
          className="min-w-[140px]"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering…
            </>
          ) : (
            "Register Driver"
          )}
        </Button>
      </div>
    </form>
  )
}
