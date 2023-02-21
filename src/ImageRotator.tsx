import Slider from "@react-native-community/slider";
import { Amplify, Storage } from "aws-amplify";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import React, { useState } from "react";
import {
  StyleSheet,
  Button,
  Image,
  View,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";

import awsconfig from "./aws-exports";

Amplify.configure(awsconfig);

interface Metadata {
  angle: number;
  rotation: "CW" | "CCW";
}

interface ImageRotatorProps {
  imageUri?: string;
}

const parsePath = (path: string) => {
  const regexPath = /^(?<path>(.*[\\/])?)(?<filename>.*)$/;

  const match = regexPath.exec(path);

  if (path && match) {
    const [name, ext] = match.groups.filename.split(".");

    return { name, ext };
  }

  throw Error("Error parsing path");
};

export default function ImageRotator({ imageUri }: ImageRotatorProps) {
  const [degrees, setDegrees] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const uploadImage = async (name: string, uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    await Storage.put(name, blob);
  };

  const uploadMetadata = (name: string, metadata: Metadata) => {
    return Storage.put(name, JSON.stringify(metadata));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const manipResult = await manipulateAsync(
        imageUri,
        [{ rotate: degrees }],
        {
          compress: 1,
          format: SaveFormat.PNG,
        }
      );

      const metadata: Metadata = {
        angle: Math.abs(degrees),
        rotation: degrees > 0 ? "CW" : "CCW",
      };

      const { name, ext } = parsePath(imageUri);
      const newName = `${name}-new.png`;
      const oldName = `${name}-old.${ext}`;

      await Promise.all([
        uploadImage(newName, manipResult.uri),
        uploadImage(oldName, imageUri),
        uploadMetadata(`${name}.json`, metadata),
      ]);

      Alert.alert("Success", "Image saved successfully");
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "There was an error saving the image: " + JSON.stringify(error, null, 2)
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!imageUri) return null;

  return (
    <>
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/template.png")}
          style={styles.templateImage}
        />
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              transform: [{ rotate: `${degrees}deg` }],
            },
          ]}
        />
      </View>
      <Slider
        style={styles.slider}
        minimumValue={-45}
        maximumValue={45}
        value={degrees}
        onValueChange={(val) => setDegrees(val)}
      />
      <View style={styles.buttonContainer}>
        <Button title="Redo" onPress={() => setDegrees(0)} />
        {isSaving ? (
          <ActivityIndicator />
        ) : (
          <Button title="Save" onPress={handleSave} />
        )}
      </View>
    </>
  );
}

const windowWidth = Dimensions.get("window").width;

const templateDimensions = {
  width: 360,
  height: 464,
};

const styles = StyleSheet.create({
  imageContainer: {
    width: windowWidth,
    height: templateDimensions.height * 1.3,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: templateDimensions.height,
    resizeMode: "contain",
  },
  templateImage: {
    position: "absolute",
    zIndex: 1,
    width: templateDimensions.width,
    height: templateDimensions.height,
  },
  slider: {
    width: 200,
    height: 40,
  },
  buttonContainer: {
    marginTop: 20,
    width: windowWidth,
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
