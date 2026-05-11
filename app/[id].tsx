import { SafeAreaView, ScrollView, View, Text, Button, Card, CardContent, Badge } from "@/components/ui";
import { ChevronLeft, Share2, Download, ShieldCheck, Image as ImageIcon, ExternalLink, Trash2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import QRCode from 'react-native-qrcode-svg';
import { Image, Modal, Pressable, Share } from "react-native";

export default function CredentialDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [credential, setCredential] = useState<any>(null);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => { if (id) fetchCredential(); }, [id]);

  async function fetchCredential() {
    const { data } = await supabase.from('credentials').select('*').eq('id', id).single();
    setCredential(data);
  }

  const onShare = async () => {
    try {
      await Share.share({
        message: `Verify this official degree on CrediChain!\nStudent: ${credential.student_name}\nHash: ${credential.hash}`,
      });
    } catch (error) { console.error(error); }
  };

  const handleRevoke = async () => {
    const reason = window.prompt("Enter reason for revocation:");
    if (!reason) return;
    
    const { error } = await supabase.from('credentials').update({ status: 'revoked', revocation_reason: reason }).eq('id', id);
    if (!error) {
      alert("Credential Revoked Successfully.");
      router.back();
    }
  };

  if (!credential) return null;
  const attachmentUrl = credential.metadata?.attachment;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-muted/30">
      <View className="px-6 py-4 flex-row justify-between items-center bg-background border-b border-border">
        <Button variant="ghost" size="icon" onPress={() => router.back()}><ChevronLeft className="text-foreground" /></Button>
        <Text variant="h4" className="text-foreground font-bold">Certificate Details</Text>
        <Button variant="ghost" size="icon" onPress={onShare}><Share2 size={20} className="text-foreground" /></Button>
      </View>
      
      <ScrollView className="flex-1 p-6">
        <Card className="bg-white border-4 border-primary/10 rounded-3xl overflow-hidden mb-8">
          <View className="bg-primary h-3" />
          <CardContent className="p-8 items-center">
            <ShieldCheck size={60} className="text-primary mb-4" />
            <Text variant="h1" className="text-primary text-3xl mb-8 text-center font-bold">{credential.student_name}</Text>
            <Text variant="h3" className="text-center mb-1 text-black font-bold">{credential.degree}</Text>
            <Text variant="muted" className="text-center uppercase text-[10px] tracking-widest">{credential.institution}</Text>
          </CardContent>
          <View className={credential.status === 'active' ? "bg-green-500/10 p-4 items-center" : "bg-destructive/10 p-4 items-center"}>
             <Text className={credential.status === 'active' ? "text-green-600 font-bold uppercase text-xs" : "text-destructive font-bold uppercase text-xs"}>
               {credential.status === 'active' ? 'Verified on Blockchain' : 'REVOKED / INVALID'}
             </Text>
          </View>
        </Card>

        {attachmentUrl && (
          <Button variant="outline" className="mb-6 flex-row gap-2 bg-background h-14" onPress={() => setShowImage(true)}>
            <ImageIcon size={18} className="text-primary" /><Text className="text-primary font-bold">View Original Scan</Text>
          </Button>
        )}

        <Card className="mb-6">
          <CardContent className="p-6 flex-row gap-6 items-center">
            <QRCode value={credential.hash} size={100} />
            <View className="flex-1">
              <Text variant="small" className="text-muted-foreground uppercase font-bold text-[10px]">Public Ledger Hash</Text>
              <Text variant="code" className="text-[10px] text-primary break-all">{credential.hash}</Text>
            </View>
          </CardContent>
        </Card>

        {credential.status === 'active' && (
          <Button variant="destructive" className="mt-4 bg-transparent border-2 border-destructive h-14" onPress={handleRevoke}>
            <Trash2 size={18} className="mr-2 text-destructive" /><Text className="text-destructive font-bold">Revoke Certificate</Text>
          </Button>
        )}
      </ScrollView>

      <Modal visible={showImage} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/95 items-center justify-center" onPress={() => setShowImage(false)}>
          <Image source={{ uri: attachmentUrl }} className="w-[90%] h-[70%] rounded-2xl" resizeMode="contain" />
          <Text className="text-white mt-6 font-bold">Tap to close</Text>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}