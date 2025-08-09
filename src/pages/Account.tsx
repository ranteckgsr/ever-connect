import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Upload, Loader2, User, FolderOpen, Settings, BarChart3 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const updateSchema = z.object({
  file: z.instanceof(FileList).optional().refine(
    (files) => !files || files.length === 0 || files[0].size <= 10 * 1024 * 1024,
    'File size must be less than 10MB'
  )
});

type UpdateForm = z.infer<typeof updateSchema>;

export default function Account() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { user, token } = useAuth();
  const { toast } = useToast();

  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      // Get presigned URL for upload
      const { data: uploadData } = await axios.post(
        `${API_URL}/api/file/upload`,
        {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Upload file to S3 using presigned URL
      await axios.put(uploadData.uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      toast({
        title: "File uploaded successfully!",
        description: "Your file has been uploaded to your account.",
      });

      // Refresh user data to get updated file info
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error uploading file",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: UpdateForm) => {
    if (data.file && data.file.length > 0) {
      await uploadFile(data.file[0]);
    }
  };

  const downloadFile = async () => {
    if (!user?.fileName) return;

    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/file/url`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Error downloading file",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">
          My Account
        </h1>
        <p className="text-muted-foreground mt-2">Manage your profile and account settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal details and account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-foreground font-medium">{user.firstName}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-foreground font-medium">{user.lastName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-foreground font-medium">@{user.username}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-foreground font-medium">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-foreground font-medium">{user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <p className="text-sm font-medium text-green-600">Active</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle>File Management</CardTitle>
              <CardDescription>
                {user.fileName ? 'Manage your uploaded file' : 'Upload a file to your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.fileName && (
                <div className="mb-6">
                  <div className="p-6 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{user.fileName}</p>
                          <p className="text-sm text-muted-foreground">Current file in your account</p>
                          <p className="text-xs text-muted-foreground">Uploaded on {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button
                        onClick={downloadFile}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="border-primary/20 hover:bg-primary/5"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {user.fileName 
                      ? 'You can replace your current file by uploading a new one below.'
                      : 'Upload your first file to get started. Supported formats: TXT, DOC, DOCX, PDF, JPG, PNG'}
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="file"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>
                            {user.fileName ? 'Upload New File' : 'Upload File'}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".txt,.doc,.docx,.pdf,.jpg,.jpeg,.png"
                              onChange={(e) => onChange(e.target.files)}
                              disabled={uploading}
                              className="cursor-pointer"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/90"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent account activity and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity to display</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your file uploads and account activity will appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences and security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Security</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Two-Factor Authentication
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium">Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email notifications</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}