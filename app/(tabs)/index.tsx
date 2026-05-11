import { SafeAreaView, ScrollView, View, Text, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from "@/components/ui";
import { Search, ShieldCheck, Award, QrCode, FileCheck, ArrowRight, Plus, Activity, Landmark, Users, CheckCircle } from "lucide-react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<any[] | null>(null);
  const [verifications, setVerifications] = useState<any[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db_changes').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    try {
      const { data: creds } = await supabase.from('credentials').select('*').order('created_at', { ascending: false });
      const { data: vers } = await supabase.from('verifications').select('*, credentials(student_name, degree)').order('timestamp', { ascending: false }).limit(5);
      setCredentials(creds);
      setVerifications(vers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Filter credentials based on search query (Name or Degree)
  const filteredCredentials = credentials?.filter(c => 
    c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.degree.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        
        {/* University Profile Header */}
        <View className="flex-row justify-between items-center mb-6 bg-primary/5 p-4 rounded-2xl border border-primary/10">
          <View className="flex-row items-center gap-3">
            <View className="bg-primary p-2 rounded-lg">
              <Landmark size={20} className="text-white" />
            </View>
            <View>
              <Text className="font-bold text-foreground">University of Excellence</Text>
              <Text className="text-[10px] text-primary uppercase font-bold tracking-tighter">Verified Issuer • West Africa</Text>
            </View>
          </View>
          <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.push("/issue")}>
            <Plus className="text-primary h-6 w-6" />
          </Button>
        </View>

        <Text variant="h1" className="text-foreground font-bold mb-1">Global Ledger</Text>
        <Text variant="muted" className="mb-8 text-xs">Real-time immutable credential stream</Text>

        {/* Verification & Search Bar */}
        <Card className="mb-8 border-primary/20 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle><Text>Verify Credential</Text></CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row gap-2">
              <View className="flex-1 relative justify-center">
                <Search size={16} className="absolute left-3 text-muted-foreground z-10" />
                <Input 
                  placeholder="Search name or 0x hash..." 
                  className="pl-10 h-12" 
                  value={searchQuery} 
                  onChangeText={setSearchQuery} 
                />
              </View>
              <Button size="icon" variant="secondary" className="h-12 w-12" onPress={() => router.push("/scan")}>
                <QrCode className="h-5 w-5 text-primary" />
              </Button>
            </View>
            {searchQuery.startsWith('0x') && (
              <Button className="w-full h-12" onPress={() => router.push({ pathname: "/(tabs)/explore", params: { hash: searchQuery } })}>
                <CheckCircle size={18} className="mr-2 text-white" />
                <Text>Verify Hash Authenticity</Text>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Ecosystem Stats */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-background border border-border p-4 rounded-2xl items-center shadow-sm">
            <Award size={20} className="text-primary mb-1" />
            <Text className="text-lg font-bold text-foreground">{credentials?.length || 0}</Text>
            <Text className="text-[10px] text-muted-foreground uppercase">Issued</Text>
          </View>
          <View className="flex-1 bg-background border border-border p-4 rounded-2xl items-center shadow-sm">
            <Activity size={20} className="text-green-500 mb-1" />
            <Text className="text-lg font-bold text-foreground">1.2k</Text>
            <Text className="text-[10px] text-muted-foreground uppercase">Verifications</Text>
          </View>
          <View className="flex-1 bg-background border border-border p-4 rounded-2xl items-center shadow-sm">
            <Users size={20} className="text-blue-500 mb-1" />
            <Text className="text-lg font-bold text-foreground">98%</Text>
            <Text className="text-[10px] text-muted-foreground uppercase">Trust Score</Text>
          </View>
        </View>

        {/* Audit Log / Verification Feed */}
        <View className="flex-row justify-between items-center mb-4">
          <Text variant="h4" className="text-foreground font-bold">Live Verification Audit</Text>
          <Activity size={16} className="text-primary animate-pulse" />
        </View>
        <Card className="mb-8 bg-muted/20 border-0">
          <CardContent className="p-4">
            {verifications?.length === 0 && <Text className="text-muted-foreground text-center py-4">Waiting for verification events...</Text>}
            {verifications?.map((v) => (
              <View key={v.id} className="flex-row items-center gap-3 mb-4 last:mb-0">
                <View className={`p-2 rounded-full ${v.result ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                  <Activity size={14} className={v.result ? 'text-green-500' : 'text-destructive'} />
                </View>
                <View className="flex-1">
                  <Text variant="small" className="font-bold text-foreground">{v.credentials?.student_name || 'System Query'}</Text>
                  <Text className="text-[10px] text-muted-foreground">{v.result ? 'Authenticity Confirmed' : 'Verification Denied'}</Text>
                </View>
                <Text className="text-[10px] text-muted-foreground italic">{new Date(v.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Credentials List */}
        <Text variant="h4" className="mb-4 text-foreground font-bold">Document Registry</Text>
        {filteredCredentials?.map((cred) => (
          <Button key={cred.id} variant="ghost" className="p-0 h-auto mb-3" onPress={() => router.push(`/credential/${cred.id}`)}>
            <Card className="w-full border-l-4" style={{ borderLeftColor: cred.status === 'active' ? '#10b981' : '#ef4444' }}>
              <CardContent className="p-4 flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-bold text-foreground text-left">{cred.student_name}</Text>
                  <Text className="text-xs text-muted-foreground text-left mt-0.5">{cred.degree}</Text>
                </View>
                <View className="items-end">
                   <Badge variant={cred.status === "active" ? "default" : "destructive"} className="h-6">
                      <Text className="text-[9px] uppercase text-white font-bold">{cred.status}</Text>
                   </Badge>
                   <Text className="text-[9px] text-muted-foreground mt-1 font-mono">{cred.hash.substring(0, 12)}...</Text>
                </View>
              </CardContent>
            </Card>
          </Button>
        ))}

        {loading && <Text className="text-center text-muted-foreground py-10 italic">Querying Ledger...</Text>}
        {!loading && filteredCredentials?.length === 0 && (
          <View className="py-20 items-center">
            <Text className="text-muted-foreground text-center">No records matching your search.</Text>
          </View>
        )}
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}