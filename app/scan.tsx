import { SafeAreaView, View, Text, Button } from "@/components/ui";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from "expo-router";
import { X, Zap } from "lucide-react-native";
import { useState } from "react";

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission?.granted) return (
    <SafeAreaView className="flex-1 items-center justify-center p-6 bg-background">
      <Text variant="h2" className="mb-4 text-foreground text-center">Camera Access Required</Text>
      <Button onPress={requestPermission}><Text>Grant Permission</Text></Button>
    </SafeAreaView>
  );

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    router.replace({ pathname: "/(tabs)/explore", params: { hash: data.includes('0x') ? data.match(/0x[a-fA-F0-9]+/)?.[0] : data } });
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView style={{ flex: 1 }} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }}>
        <SafeAreaView className="flex-1 justify-between p-6">
          <Button variant="secondary" size="icon" className="rounded-full bg-black/50" onPress={() => router.back()}><X className="text-white" /></Button>
          <View className="items-center">
            <View className="w-64 h-64 border-2 border-primary rounded-3xl" />
            <Text className="text-white mt-8 text-center">Align QR code within the frame</Text>
          </View>
          <View className="items-center"><Text className="text-primary font-bold bg-primary/20 px-4 py-2 rounded-full">Instant Verification</Text></View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}