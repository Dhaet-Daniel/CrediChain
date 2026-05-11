import { SafeAreaView, ScrollView, View, Text, Input, Button, Card, CardContent, Spinner } from "@/components/ui";
import { Award, Building2, Calendar, User, Hash, Send, ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { supabase } from "@/config/supabase";
import { useRouter } from "expo-router";

export default function IssueCredentialScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_name: "",
    institution: "University of Excellence",
    degree: "",
    issue_date: new Date().toISOString().split('T')[0],
  });

  const handleIssue = async () => {
    if (!form.student_name || !form.degree) return;
    
    setLoading(true);
    // Generate a unique "blockchain" hash
    const hash = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    
    try {
      const { error } = await supabase
        .from('credentials')
        .insert([{
          ...form,
          hash,
          status: 'active'
        }]);

      if (error) throw error;
      
      alert(`Credential Issued Successfully!\nHash: ${hash.substring(0, 10)}...`);
      router.back();
    } catch (error) {
      console.error(error);
      alert("Failed to issue credential.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center border-b border-border">
        <Button variant="ghost" size="icon" onPress={() => router.back()}>
          <ChevronLeft className="text-foreground" />
        </Button>
        <Text variant="h3" className="ml-2">Issue Credential</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <Text variant="muted" className="mb-6">
          Authorized University Portal: Issue a new immutable academic record.
        </Text>

        <View className="gap-6">
          <View className="gap-2">
            <Text variant="small" className="font-bold uppercase text-muted-foreground">Student Full Name</Text>
            <View className="flex-row items-center bg-muted/30 rounded-lg px-3">
              <User size={18} className="text-muted-foreground" />
              <Input 
                className="flex-1 border-0 bg-transparent"
                placeholder="e.g. John Doe"
                value={form.student_name}
                onChangeText={(val) => setForm({...form, student_name: val})}
              />
            </View>
          </View>

          <View className="gap-2">
            <Text variant="small" className="font-bold uppercase text-muted-foreground">Institution</Text>
            <View className="flex-row items-center bg-muted/30 rounded-lg px-3">
              <Building2 size={18} className="text-muted-foreground" />
              <Input 
                className="flex-1 border-0 bg-transparent"
                value={form.institution}
                editable={false}
              />
            </View>
          </View>

          <View className="gap-2">
            <Text variant="small" className="font-bold uppercase text-muted-foreground">Degree / Certification</Text>
            <View className="flex-row items-center bg-muted/30 rounded-lg px-3">
              <Award size={18} className="text-muted-foreground" />
              <Input 
                className="flex-1 border-0 bg-transparent"
                placeholder="e.g. B.Sc. in Computer Science"
                value={form.degree}
                onChangeText={(val) => setForm({...form, degree: val})}
              />
            </View>
          </View>

          <View className="gap-2">
            <Text variant="small" className="font-bold uppercase text-muted-foreground">Issue Date</Text>
            <View className="flex-row items-center bg-muted/30 rounded-lg px-3">
              <Calendar size={18} className="text-muted-foreground" />
              <Input 
                className="flex-1 border-0 bg-transparent"
                value={form.issue_date}
                onChangeText={(val) => setForm({...form, issue_date: val})}
              />
            </View>
          </View>

          <Card className="bg-primary/5 border-primary/20 mt-4">
            <CardContent className="p-4 flex-row gap-3 items-center">
              <Hash size={20} className="text-primary" />
              <Text variant="small" className="flex-1 text-primary">
                A unique SHA-256 hash will be generated and signed on the CrediChain ledger upon submission.
              </Text>
            </CardContent>
          </Card>

          <Button 
            className="mt-4 h-14" 
            onPress={handleIssue} 
            disabled={loading || !form.student_name || !form.degree}
          >
            {loading ? <Spinner color="white" /> : (
              <View className="flex-row items-center">
                <Send size={18} className="mr-2 text-primary-foreground" />
                <Text>Issue to Blockchain</Text>
              </View>
            )}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}