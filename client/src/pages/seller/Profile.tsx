import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SellerLayout from "@/components/layout/SellerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  getSellerProfile, 
  updateSellerProfile 
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";

// Define SellerProfile type
interface SellerProfile {
  id: number;
  email: string;
  businessName: string;
  phone?: string;
  businessAddress?: string;
  warehouseAddress?: string;
  zipCode?: string;
  gst?: string;
  approved: boolean;
  rejected: boolean;
}

// Validation utility functions
const isValidPhoneNumber = (phone: string): boolean => {
  // Indian phone number validation (10 digits, optionally with +91 prefix)
  const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const isValidGST = (gst: string): boolean => {
  // GST format: 2 digits, 5 chars, 1 digit, 1 char, 1 digit, 1 char, 1 digit, 1 char, 1 digit
  const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
  return gstRegex.test(gst);
};

const isValidZipCode = (zipCode: string): boolean => {
  // Indian ZIP code (6 digits)
  const zipCodeRegex = /^\d{6}$/;
  return zipCodeRegex.test(zipCode);
};

const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Password strength criteria
const passwordCriteria = [
  { id: 'length', label: 'At least 8 characters', check: (pwd: string) => pwd.length >= 8 },
  { id: 'uppercase', label: 'At least one uppercase letter', check: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'At least one lowercase letter', check: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'At least one number', check: (pwd: string) => /\d/.test(pwd) },
  { id: 'special', label: 'At least one special character', check: (pwd: string) => /[@$!%*?&]/.test(pwd) },
];

export default function SellerProfile() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form state
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [gst, setGst] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Validation states
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [gstValid, setGstValid] = useState<boolean | null>(null);
  const [zipCodeValid, setZipCodeValid] = useState<boolean | null>(null);

  const { data: profile, isLoading, isError } = useQuery<SellerProfile>({
    queryKey: ["/api/seller/profile"]
  });
  
  // Set form data when profile is loaded
  React.useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setBusinessAddress(profile.businessAddress || "");
      setWarehouseAddress(profile.warehouseAddress || "");
      setZipCode(profile.zipCode || "");
      setGst(profile.gst || "");
      
      // Validate initial values
      if (profile.phone) setPhoneValid(isValidPhoneNumber(profile.phone));
      if (profile.gst) setGstValid(isValidGST(profile.gst));
      if (profile.zipCode) setZipCodeValid(isValidZipCode(profile.zipCode));
    }
  }, [profile]);

  // Validation handlers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    
    if (value && value.length > 0) {
      setPhoneValid(isValidPhoneNumber(value));
    } else {
      setPhoneValid(null);
    }
  };

  const handleGSTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase(); // Auto-convert to uppercase
    setGst(value);
    
    if (value && value.length > 0) {
      setGstValid(isValidGST(value));
    } else {
      setGstValid(null);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZipCode(value);
    
    if (value && value.length > 0) {
      setZipCodeValid(isValidZipCode(value));
    } else {
      setZipCodeValid(null);
    }
  };

  // Check password criteria
  const [passwordCriteriaChecked, setPasswordCriteriaChecked] = useState<Record<string, boolean>>({});
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    
    const newChecks: Record<string, boolean> = {};
    passwordCriteria.forEach(criterion => {
      newChecks[criterion.id] = criterion.check(value);
    });
    setPasswordCriteriaChecked(newChecks);
  };

  const handleSaveProfile = async () => {
    // Required field validation
    if (!businessName) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Business name is required",
      });
      return;
    }

    // Phone validation
    if (phone && !isValidPhoneNumber(phone)) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Please enter a valid Indian phone number",
      });
      return;
    }

    // GST validation
    if (gst && !isValidGST(gst)) {
      toast({
        variant: "destructive",
        title: "Invalid GST number",
        description: "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)",
      });
      return;
    }

    // ZIP code validation
    if (zipCode && !isValidZipCode(zipCode)) {
      toast({
        variant: "destructive",
        title: "Invalid ZIP code",
        description: "Please enter a valid 6-digit Indian ZIP code",
      });
      return;
    }

    // Password validation
    if (newPassword && !isStrongPassword(newPassword)) {
      toast({
        variant: "destructive",
        title: "Weak password",
        description: "Password doesn't meet the security requirements",
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "New password and confirm password do not match",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const updateData = {
        businessName,
        phone,
        businessAddress,
        warehouseAddress,
        zipCode,
        gst,
      };

      // Only include password fields if attempting to change password
      if (newPassword && currentPassword) {
        Object.assign(updateData, {
          currentPassword,
          newPassword,
        });
      }

      await updateSellerProfile(updateData);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Refetch the profile data
      queryClient.invalidateQueries({queryKey: ["/api/seller/profile"]});
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="text-center py-12">Loading profile...</div>
      </SellerLayout>
    );
  }

  if (isError) {
    return (
      <SellerLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load profile. Please refresh the page.
          </AlertDescription>
        </Alert>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <h1 className="text-2xl font-bold mb-6">Business Profile</h1>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="businessName" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Business Name*
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  readOnly
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">Business name cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={email}
                  readOnly
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone Number
                  {phoneValid !== null && (
                    phoneValid ? 
                      <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" /> : 
                      <XCircle className="h-4 w-4 ml-2 text-red-500" />
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Format: +91 XXXXXXXXXX or 10 digits starting with 6-9</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+91 9876543210"
                  className={`mt-1 ${phoneValid === false ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {phoneValid === false && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid Indian phone number</p>
                )}
              </div>
              <div>
                <Label htmlFor="gst" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  GST Number
                  {gstValid !== null && (
                    gstValid ? 
                      <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" /> : 
                      <XCircle className="h-4 w-4 ml-2 text-red-500" />
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Format: 22AAAAA0000A1Z5 (15 characters)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="gst"
                  value={gst}
                  onChange={handleGSTChange}
                  placeholder="22AAAAA0000A1Z5"
                  className={`mt-1 ${gstValid === false ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {gstValid === false && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid GST number</p>
                )}
              </div>
              <div>
                <Label htmlFor="businessAddress" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Business Address
                </Label>
                <Textarea
                  id="businessAddress"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Enter your business address"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="warehouseAddress" className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Warehouse Address
                </Label>
                <Textarea
                  id="warehouseAddress"
                  value={warehouseAddress}
                  onChange={(e) => setWarehouseAddress(e.target.value)}
                  placeholder="Enter your warehouse address"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="zipCode" className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Zip Code
                  {zipCodeValid !== null && (
                    zipCodeValid ? 
                      <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" /> : 
                      <XCircle className="h-4 w-4 ml-2 text-red-500" />
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter a valid 6-digit Indian PIN code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={handleZipCodeChange}
                  placeholder="400001"
                  className={`mt-1 ${zipCodeValid === false ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {zipCodeValid === false && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid 6-digit PIN code</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="newPassword" className="flex items-center">
                      New Password
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="w-80">
                            <p className="text-sm">Password must contain:</p>
                            <ul className="text-xs list-disc pl-4 mt-1">
                              <li>At least 8 characters</li>
                              <li>At least one uppercase letter (A-Z)</li>
                              <li>At least one lowercase letter (a-z)</li>
                              <li>At least one number (0-9)</li>
                              <li>At least one special character (!@#$...)</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                    
                    {/* Password strength indicator */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        {passwordCriteria.map((criterion) => (
                          <div key={criterion.id} className="flex items-center text-xs">
                            {passwordCriteriaChecked[criterion.id] ? (
                              <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-2 text-red-500" />
                            )}
                            <span className={passwordCriteriaChecked[criterion.id] ? 'text-green-600' : 'text-red-500'}>
                              {criterion.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`mt-1 ${newPassword && confirmPassword && newPassword !== confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {newPassword && confirmPassword && newPassword === confirmPassword && (
                      <div className="flex items-center mt-1 text-green-600 text-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        <span>Passwords match</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Leave the password fields empty if you don't want to change it.
              </p>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile} 
                disabled={isUpdating}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </SellerLayout>
  );
}
