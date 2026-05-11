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
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('hash', finalHash)
        .single();

      // AUDIT LOGGING: Record this verification attempt
      await supabase.from('verifications').insert([{
        credential_id: data?.id || null,
        result: !!data && data.status === 'active'
      }]);

      if (error) {
         setResult("not_found");
      } else {
         setResult(data);
      }
    } catch (error) {
      console.error(error);
      setResult("error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <Text variant="h1" className="mb-2 text-foreground font-bold">Verify</Text>
        <Text variant="muted" className="mb-6">Verify academic credentials instantly on the blockchain.</Text>

        <Card className="mb-8">
          <CardContent className="pt-6 gap-4">
            <View className="gap-2">
              <Text variant="small" className="font-bold uppercase text-muted-foreground">Credential Hash</Text>
              <View className="flex-row gap-2">
                <Input placeholder="Enter 0x... hash" className="flex-1" value={hash} onChangeText={(val) => { setHash(val); setResult(null); }} />
              </View>
            </View>
            <Button className="w-full" onPress={() => handleVerify()} disabled={isVerifying || !hash}>
              {isVerifying ? <Spinner size="small" color="white" /> : (
                <View className="flex-row items-center">
                  <Search className="h-4 w-4 mr-2 text-primary-foreground" /><Text>Verify Credential</Text>
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
              <Text className="text-center text-muted-foreground mt-2">Hash not found or tampered.</Text>
            </CardContent>
          </Card>
        )}

        {!isVerifying && result && result !== "not_found" && (
          <View className="gap-6">
            <Card className={result.status === 'active' ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"}>
              <CardContent className="pt-6 items-center">
                {result.status === 'active' ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                    <Text variant="h4" className="text-green-700">Verified Authentic</Text>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-12 w-12 text-destructive mb-2" />
                    <Text variant="h4" className="text-destructive">Credential Revoked</Text>
                    <Text className="text-destructive text-xs mt-1">Reason: {result.revocation_reason || 'Administrative Action'}</Text>
                  </>
                )}
                <Text variant="small" className="text-muted-foreground mt-2">ID: {result.hash.substring(0, 16)}...</Text>
              </CardContent>
            </Card>

            <View className="gap-4">
              <DetailRow icon={<User size={18} className="text-muted-foreground" />} label="Student" value={result.student_name} />
              <DetailRow icon={<Building2 size={18} className="text-muted-foreground" />} label="Institution" value={result.institution} />
              <DetailRow icon={<ShieldCheck size={18} className="text-muted-foreground" />} label="Degree" value={result.degree} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <View className="flex-row items-center gap-4 bg-muted/30 p-4 rounded-xl">
      <View className="bg-background p-2 rounded-lg border border-border">{icon}</View>
      <View><Text variant="small" className="text-muted-foreground">{label}</Text><Text variant="large" className="font-semibold text-foreground">{value}</Text></View>
    </View>
  );
}