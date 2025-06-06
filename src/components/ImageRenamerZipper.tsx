"use client";

import { useState, useEffect } from "react";
import { downloadZip } from "client-zip";
import Image from "next/image";

interface FileWithPreview {
  file: File;
  preview: string;
}

const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const makeUniqueNames = (names: string[]): string[] => {
  const counts: Record<string, number> = {};
  return names.map((base) => {
    if (!counts[base]) {
      counts[base] = 1;
      return base;
    } else {
      const unique = `${base}-${counts[base]}`;
      counts[base]++;
      return unique;
    }
  });
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

    const rawNames = names
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .map(sanitizeFilename);

    const uniqueNames = makeUniqueNames(rawNames);

    if (files.length !== uniqueNames.length) {
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
          name: `${uniqueNames[index]}${extension}`,
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
      alert("Error generando el archivo ZIP");
    }
  };

  return (
    <div className="p-4 max-w-3xl w-full mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Renombrador y Compresor de Imágenes
        </h1>
        <p className="text-neutral-content text-sm">
          Ingresa nombres únicos para renombrar imágenes y descargarlas como ZIP
        </p>
      </div>

      <div className="card bg-base-300 shadow-md">
        <div className="card-body space-y-4">
          <div>
            <label className="block font-medium text-neutral-content mb-1">
              Nombres
              <span className="badge badge-sm badge-outline ml-2">
                {names.split("\n").filter((n) => n.trim()).length}
              </span>
            </label>
            <textarea
              className="textarea textarea-primary w-full text-base"
              rows={6}
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Escribe los nombres de las imágenes, uno por línea."
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-content mb-1">
              Subir Imágenes
              <span className="badge badge-sm badge-outline ml-2">
                {files.length}
              </span>
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="file-input file-input-primary w-full max-w-sm"
            />
            {files.some((f) => !f.file.name) && (
              <p className="mt-1 text-sm text-warning">
                Algunos archivos fueron renombrados automáticamente
              </p>
            )}
          </div>

          <button onClick={handleDownload} className="btn btn-primary w-full">
            Descargar como ZIP
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="card bg-base-200 shadow-md">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-neutral-content mb-2">
              Archivos Subidos
              <span className="ml-2 badge badge-outline">
                {files.length}
              </span>
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {files.map((item, index) => (
                <li key={index} className="card card-side bg-base-300 shadow">
                  <figure className="w-28 aspect-square bg-base-100 rounded-l-box overflow-hidden">
                    <Image
                      src={item.preview}
                      alt={item.file.name}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  </figure>
                  <div className="card-body py-2 px-4">
                    <span className="text-neutral-content font-medium text-sm truncate max-w-xs">
                      {item.file.name}
                    </span>
                    <span className="text-xs text-base-content">
                      {(item.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageRenamerZipper;
