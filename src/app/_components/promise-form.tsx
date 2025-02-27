"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function PromiseForm() {
  const [promise, setPromise] = useState("")
  const [promiseSize, setPromiseSize] = useState("small")
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [date, setDate] = useState<Date>()
  const [hour, setHour] = useState("12")
  const [minute, setMinute] = useState("00")
  const [period, setPeriod] = useState("PM")

  const handlePromiseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 255) {
      setPromise(e.target.value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({
      promise,
      date,
      time: `${hour}:${minute} ${period}`,
      promiseSize,
    })
  }

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Make a Promise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <Button onClick={() => setIsWalletConnected(!isWalletConnected)} variant="outline" className="w-full">
            <Wallet className="mr-2 h-4 w-4" />
            {isWalletConnected ? "Wallet Connected" : "Connect Wallet"}
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="promise">Promise</Label>
              <Textarea
                id="promise"
                placeholder="Enter your promise here..."
                value={promise}
                onChange={handlePromiseChange}
                required
              />
              <p className="text-xs text-muted-foreground text-right">{promise.length}/255 characters</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <div className="flex gap-2">
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")).map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Note: Date and time will be recorded in UTC timezone</p>
            </div>

            <div className="space-y-2">
              <Label>Promise Size</Label>
              <RadioGroup value={promiseSize} onValueChange={setPromiseSize} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="small" />
                  <Label htmlFor="small">Small (0.01 SOL)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium (0.05 SOL)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="large" />
                  <Label htmlFor="large">Large (0.1 SOL)</Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={!isWalletConnected}>
              {isWalletConnected ? "Make Promise" : "Connect Wallet to Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

