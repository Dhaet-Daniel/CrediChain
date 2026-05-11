import { SafeAreaView, ScrollView, View, Text, Card, CardContent, Badge, Button } from "@/components/ui";
import { Wallet, ShieldCheck, Award, LogOut, Settings, Copy, ExternalLink, User } from "lucide-react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { Image } from "react-native";

export default function ProfileScreen() {
  const [credentials, setCredentials] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCredentials();
  }, []);

  async function fetchMyCredentials() {
    try {
      // In a real app, we would filter by the logged-in user's ID or wallet address
      // For this demo, we'll just fetch John Doe's credentials
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('student_name', 'John Doe')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data);
    } catch (error) {
      console.error('Error fetching profile credentials:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <View className="items-center mb-8">
          <View className="h-24 w-24 rounded-full border-4 border-primary/20 overflow-hidden bg-muted items-center justify-center">
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop" }} 
              className="h-full w-full"
            />
          </View>
          <Text variant="h2" className="mt-4">John Doe</Text>
          <Text variant="muted">Digital Identity: 0x7a8b...m1n2</Text>
          <View className="flex-row gap-2 mt-4">
            <Button variant="outline" size="sm" className="rounded-full">
              <Copy className="h-3 w-3 mr-1" />
              <Text>Copy ID</Text>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              <ExternalLink className="h-3 w-3 mr-1" />
              <Text>Explorer</Text>
            </Button>
          </View>
        </View>

        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-primary/5 p-4 rounded-2xl items-center border border-primary/10">
            <Award className="h-6 w-6 text-primary mb-1" />
            <Text className="font-bold text-lg">{credentials?.length || 0}</Text>
            <Text className="text-[10px] text-muted-foreground uppercase">Credentials</Text>
          </View>
          <View className="flex-1 bg-green-500/5 p-4 rounded-2xl items-center border border-green-500/10">
            <ShieldCheck className="h-6 w-6 text-green-500 mb-1" />
            <Text className="font-bold text-lg">Active</Text>
            <Text className="text-[10px] text-muted-foreground uppercase">Status</Text>
          </View>
        </View>

        <Text variant="h4" className="mb-4">Credential Wallet</Text>
        
        {loading && (
          <View className="py-10 items-center">
            <Text className="text-muted-foreground">Loading wallet...</Text>
          </View>
        )}

        {!loading && credentials?.map((cred) => (
          <Card key={cred.id} className="mb-4 overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text variant="large" className="font-bold">{cred.degree}</Text>
                  <Text variant="small" className="text-muted-foreground">{cred.institution}</Text>
                </View>
                <Badge variant="secondary">
                  <Text className="text-[10px] uppercase">{cred.issue_date.split("-")[0]}</Text>
                </Badge>
              </View>
              <View className="h-[1px] bg-border my-3" />
              <View className="flex-row justify-between items-center">
                <Text variant="code" className="text-[10px] text-muted-foreground">
                  HASH: {cred.hash.substring(0, 16)}...
                </Text>
                <Button variant="ghost" size="sm" className="h-8">
                  <Text className="text-primary text-xs">Share</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        ))}

        {!loading && credentials?.length === 0 && (
           <View className="py-10 items-center">
             <Text className="text-muted-foreground text-center">No credentials in your wallet.</Text>
           </View>
        )}

        <View className="mt-8 gap-2">
          <Button variant="outline" className="justify-start">
            <Settings className="h-4 w-4 mr-2" />
            <Text>Security Settings</Text>
          </Button>
          <Button variant="destructive" className="justify-start">
            <LogOut className="h-4 w-4 mr-2" />
            <Text>Logout Wallet</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
