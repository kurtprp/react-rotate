import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Button, ScrollView } from "react-native";

import ImageRotator from "./src/ImageRotator";

export default function App() {
  const [image, setImage] = useState<string>();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 20,
      }}
    >
      <Button title="Pick an Image" onPress={pickImage} />
      <ImageRotator imageUri={image} />
    </ScrollView>
  );
}
