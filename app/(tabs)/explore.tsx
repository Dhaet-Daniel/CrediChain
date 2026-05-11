import { SafeAreaView, ScrollView, View, Text, Input, Button, Card, CardContent, Badge, Spinner } from "@/components/ui";
import { Search, QrCode, ShieldCheck, ShieldAlert, CheckCircle2, Calendar, Building2, User } from "lucide-react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { useLocalSearchParams } from "expo-router";

export default function VerifyScreen() {
  const { hash: paramHash } = useLocalSearchParams();
  const [hash, setHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (paramHash) {
      setHash(paramHash as string);
      handleVerify(paramHash as string);
    }
  }, [paramHash]);

  const handleVerify = async (hashToVerify?: string) => {
    const finalHash = hashToVerify || hash;
    if (!finalHash) return;
    
    setIsVerifying(true);
    setResult(null);

    try {
      // Simulate blockchain delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('hash', finalHash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
           setResult("not_found");
        } else {
           throw error;
        }
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error('Error verifying credential:', error);
      setResult("error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <Text variant="h1" className="mb-2">Verify</Text>
        <Text variant="muted" className="mb-6">Verify academic credentials instantly on the blockchain.</Text>

        <Card className="mb-8">
          <CardContent className="pt-6 gap-4">
            <View className="gap-2">
              <Text variant="small" className="font-bold uppercase text-muted-foreground">Credential Hash</Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input 
                    placeholder="Enter 0x... hash" 
                    value={hash}
                    onChangeText={(val) => {
                      setHash(val);
                      setResult(null);
                    }}
                  />
                </View>
                <Button size="icon" variant="secondary">
                  <QrCode className="h-4 w-4" />
                </Button>
              </View>
            </View>
            <Button className="w-full" onPress={() => handleVerify()} disabled={isVerifying || !hash}>
              {isVerifying ? <Spinner size="small" color="white" /> : (
                <View className="flex-row items-center">
                  <Search className="h-4 w-4 mr-2 text-primary-foreground" />
                  <Text>Verify Credential</Text>
                </View>
              )}
            </Button>
          </CardContent>
        </Card>

        {isVerifying && (
          <View className="items-center py-10">
            <Spinner size="large" />
            <Text className="mt-4 text-muted-foreground italic">Querying Distributed Ledger...</Text>
          </View>
        )}

        {!isVerifying && result === "not_found" && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 items-center">
              <ShieldAlert className="h-12 w-12 text-destructive mb-2" />
              <Text variant="h4" className="text-destructive">Invalid Credential</Text>
              <Text variant="p" className="text-center text-muted-foreground mt-2">
                This hash does not exist on the CrediChain ledger. It may be forged or tampered with.
              </Text>
            </CardContent>
          </Card>
        )}

        {!isVerifying && result && result !== "not_found" && result !== "error" && (
          <View className="gap-6">
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-6 items-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <Text variant="h4" className="text-green-700">Verified Authentic</Text>
                <Text variant="small" className="text-green-600/70">Blockchain ID: {result.hash.substring(0, 16)}...</Text>
              </CardContent>
            </Card>

            <Text variant="h4">Credential Details</Text>
            
            <View className="gap-4">
              <DetailRow icon={<User size={18} className="text-muted-foreground" />} label="Student" value={result.student_name} />
              <DetailRow icon={<Building2 size={18} className="text-muted-foreground" />} label="Institution" value={result.institution} />
              <DetailRow icon={<ShieldCheck size={18} className="text-muted-foreground" />} label="Degree" value={result.degree} />
              <DetailRow icon={<Calendar size={18} className="text-muted-foreground" />} label="Issue Date" value={result.issue_date} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <View className="flex-row items-center gap-4 bg-muted/30 p-4 rounded-xl">
      <View className="bg-background p-2 rounded-lg border border-border">
        {icon}
      </View>
      <View>
        <Text variant="small" className="text-muted-foreground">{label}</Text>
        <Text variant="large" className="font-semibold">{value}</Text>
      </View>
    </View>
  );
}