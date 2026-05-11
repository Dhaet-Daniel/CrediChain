import { SafeAreaView, ScrollView, View, Text, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from "@/components/ui";
import { Search, ShieldCheck, Award, QrCode, FileCheck, ArrowRight, Plus } from "lucide-react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<any[] | null>(null);
  const [searchHash, setSearchHash] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredentials();

    const channel = supabase
      .channel('credentials_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credentials' }, (payload) => {
        fetchCredentials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCredentials() {
    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleVerifySearch = () => {
    if (!searchHash) return;
    router.push({
      pathname: "/(tabs)/explore",
      params: { hash: searchHash }
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text variant="h1" className="text-primary font-bold">CrediChain</Text>
            <Text variant="muted">Academic Ledger (Supabase)</Text>
          </View>
          <Button variant="secondary" size="icon" className="rounded-full" onPress={() => router.push("/issue")}>
            <Plus className="text-primary h-6 w-6" />
          </Button>
        </View>

        {/* Verification Bar */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>
              <Text>Verify a Credential</Text>
            </CardTitle>
            <CardDescription>
              <Text>Enter the unique certificate hash or scan QR code</Text>
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input 
                  placeholder="0x..." 
                  value={searchHash}
                  onChangeText={setSearchHash}
                />
              </View>
              <Button size="icon" variant="secondary">
                <QrCode className="h-4 w-4" />
              </Button>
            </View>
            <Button className="w-full" onPress={handleVerifySearch}>
              <Search className="h-4 w-4 mr-2" />
              <Text>Verify Credential</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <View className="flex-row gap-4 mb-6">
          <Card className="flex-1">
            <CardContent className="pt-6 items-center">
              <Award className="h-8 w-8 text-primary mb-2" />
              <Text variant="h3">
                <Text>{credentials?.length || 0}</Text>
              </Text>
              <Text variant="small" className="text-center text-muted-foreground">Issued</Text>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="pt-6 items-center">
              <FileCheck className="h-8 w-8 text-green-500 mb-2" />
              <Text variant="h3">
                <Text>1,204</Text>
              </Text>
              <Text variant="small" className="text-center text-muted-foreground">Verified</Text>
            </CardContent>
          </Card>
        </View>

        {/* Recent Credentials */}
        <View className="mb-4 flex-row justify-between items-end">
          <Text variant="h4">Recently Issued</Text>
          <Button variant="link" size="sm">
            <Text className="text-primary">View all</Text>
            <ArrowRight className="h-4 w-4 ml-1 text-primary" />
          </Button>
        </View>

        {credentials?.map((cred) => (
          <Card key={cred.id} className="mb-3">
            <CardContent className="p-4 flex-row justify-between items-center">
              <View className="flex-1">
                <Text variant="large" className="font-semibold">{cred.student_name}</Text>
                <Text variant="small" className="text-muted-foreground">{cred.institution}</Text>
                <Text variant="small" className="text-primary mt-1">{cred.degree}</Text>
              </View>
              <View className="items-end">
                <Badge variant={cred.status === "active" ? "default" : "destructive"}>
                  <Text className="text-[10px] uppercase">{cred.status}</Text>
                </Badge>
                <Text variant="code" className="text-[10px] mt-2 text-muted-foreground">
                  {cred.hash.substring(0, 10)}...
                </Text>
              </View>
            </CardContent>
          </Card>
        ))}

        {loading && (
           <View className="py-10 items-center">
             <Text className="text-muted-foreground">Loading credentials...</Text>
           </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}