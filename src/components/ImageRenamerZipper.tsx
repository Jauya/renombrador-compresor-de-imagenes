"use client";

import { useState, useEffect } from "react";
import { downloadZip } from "client-zip";
import Image from "next/image";

interface FileWithPreview {
  file: File;
  preview: string;
}

const sanitizeFilename = (name: string): string => {
  const replacements: { [key: string]: string } = {
    ñ: "n",
    á: "a",
    é: "e",
    í: "i",
    ó: "o",
    ú: "u",
    Á: "A",
    É: "E",
    Í: "I",
    Ó: "O",
    Ú: "U",
  };

  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[ñáéíóúÁÉÍÓÚ]/g, (match) => replacements[match] || match)
    .replace(/[^a-z0-9\-]/g, "");
};

const ImageRenamerZipper: React.FC = () => {
  const [names, setNames] = useState<string>("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const uploadedFiles = e.target.files ? Array.from(e.target.files) : [];

    const validatedFiles = uploadedFiles
      .filter((file) => file.size > 0)
      .map((file) => ({
        file,
        name:
          file.name ||
          `image-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      }));

    const filesWithPreview = validatedFiles.map((item) => ({
      file: item.file,
      preview: URL.createObjectURL(item.file),
    }));

    setFiles(filesWithPreview);
  };

  const handleDownload = async (): Promise<void> => {
    if (!files.length) {
      alert("No se han subido archivos.");
      return;
    }

    const nameArray = names.split("\n").map(sanitizeFilename);

    if (files.length !== nameArray.length) {
      alert("La cantidad de archivos y los nombres deben coincidir.");
      return;
    }

    try {
      const entries = files.map((item, index) => {
        const originalName = item.file.name || `file-${index + 1}`;
        const extension = originalName.includes(".")
          ? originalName.slice(originalName.lastIndexOf("."))
          : "";

        return {
          name: `${nameArray[index]}${extension}`,
          input: item.file,
        };
      });

      const blob = await downloadZip(entries).blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "renamed-images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando ZIP:", error);
      alert("Error genenrando el archivo ZIP");
    }
  };

  return (
    <div className="p-4 max-w-2xl w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-primary">
        Renombrador y Compresor de Imágenes
      </h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-neutral-content">
          Nombres (uno por línea):
        </label>
        <textarea
          className="textarea textarea-primary text-sky-50 w-full"
          rows={6}
          value={names}
          onChange={(e) => setNames(e.target.value)}
          placeholder="Ingresa los nombres para los archivos..."
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-neutral-content">
          Subir Imágenes:
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="file-input file-input-primary file-input-md w-full max-w-xs"
        />
        <p className="mt-2 text-sm text-red-500">
          {files.some((f) => !f.file.name) &&
            "Algunos archivos fueron renombrados automáticamente"}
        </p>
      </div>

      <button onClick={handleDownload} className="btn btn-primary w-full">
        Descargar como ZIP
      </button>

      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 text-neutral-content">
            Archivos Subidos ({files.length})
          </h2>
          <ul className="space-y-2">
            {files.map((item, index) => (
              <li
                key={index}
                className="card card-side bg-base-300 shadow-xl"
              >
                <div className="avatar">
                  <figure className="w-28 aspect-square bg-base-200 rounded-l-box">
                    <Image
                      src={item.preview}
                      alt={item.file.name}
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </figure>
                </div>
                <div className="card-body w-full">
                  <span className="sm:max-w-96 max-w-60 text-neutral-content overflow-hidden text-nowrap text-ellipsis">{item.file.name}</span>
                  <span className="text-base-content">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageRenamerZipper;
