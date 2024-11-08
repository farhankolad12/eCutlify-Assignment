import { useRef, useState } from "react";
import "./App.css";
import axios from "axios";
import { toast } from "react-toastify";

const url = "https://api.segmind.com/v1/live-portrait";

function App() {
  const [selectedImage, setSelectedImage] = useState<any>("/default-image.jpg");
  const [result, setResult] = useState<any>("/default-video.mp4");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const videoRef: any = useRef(null);
  const photoRef = useRef<any>(null);

  const handleDragEnter = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;

    console.log(files);

    // Upload files to the server
    setSelectedImage(files[0]);
  };

  async function imageUrlToBase64(imageUrl: string) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader: any = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // Remove "data:image/*;base64," prefix
      reader.readAsDataURL(blob);
    });
  }

  function getVideo() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: 500,
          height: 500,
        },
      })
      .then((stream) => {
        let video: any = videoRef.current;
        video.srcObject = stream;
        video?.play();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function takePhoto() {
    const width = 414;
    const height = width / (16 / 9);

    let video: any = videoRef.current;
    let photo: any = photoRef.current;

    photo.width = width;
    photo.height = height;

    let ctx = photo.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);
    setIsCameraOn(false);
    setSelectedImage(photoRef.current.toDataURL());
    videoRef.current?.srcObject?.getTracks().forEach(function (track: any) {
      track.stop();
    });
  }

  async function handleSubmit() {
    if (!selectedImage) {
      return toast.error("Please upload a portrait image");
    }

    setLoading(true);
    const data = {
      face_image:
        typeof selectedImage === "string"
          ? selectedImage.includes("data:image")
            ? selectedImage.split(",")[1]
            : await imageUrlToBase64(
                typeof selectedImage === "string"
                  ? selectedImage
                  : URL.createObjectURL(selectedImage)
              )
          : await imageUrlToBase64(URL.createObjectURL(selectedImage)),
      driving_video:
        "https://segmind-sd-models.s3.amazonaws.com/display_images/liveportrait-video.mp4",
      live_portrait_dsize: 512,
      live_portrait_scale: 2.3,
      video_frame_load_cap: 128,
      live_portrait_lip_zero: true,
      live_portrait_relative: true,
      live_portrait_vx_ratio: 0,
      live_portrait_vy_ratio: -0.12,
      live_portrait_stitching: true,
      video_select_every_n_frames: 1,
      live_portrait_eye_retargeting: false,
      live_portrait_lip_retargeting: false,
      live_portrait_lip_retargeting_multiplier: 1,
      live_portrait_eyes_retargeting_multiplier: 1,
    };

    try {
      const response = await axios.post(url, data, {
        headers: { "x-api-key": import.meta.env.VITE_APP_SEGMIND_KEY },
        responseType: "arraybuffer",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const objectURL = URL.createObjectURL(blob);
      toast.success("Video generated successfully!");
      setResult(objectURL);
    } catch (error: any) {
      if (error.status === 400) {
        toast.error(`Invalid Face image`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setLoading(true);
    const link = document.createElement("a");
    let name = result?.split("/") || [];
    name = name[name?.length - 1];
    link.setAttribute("download", name);
    link.href = result;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setLoading(false);
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="rounded-full flex flex-col gap-2 item-center justify-center text-center">
            <img
              className="md:w-[250px] w-[200px] h-[200px] md:h-[250px]"
              src="/loading.gif"
              alt="Loading"
            />
            <strong>Generating...</strong>
          </div>
        </div>
      )}
      <div className="flex gap-5 justify-center w-full p-5 md:flex-row flex-col">
        <div className="bg-[#f4f4f5] p-4 md:w-1/3 w-full rounded-lg">
          <div className="flex flex-col gap-2 justify-center h-full">
            <span>Face Image</span>
            <div className="flex flex-col">
              {selectedImage ? (
                <div className="w-full h-[200px]">
                  <img
                    src={
                      selectedImage?.lastModified
                        ? URL.createObjectURL(selectedImage)
                        : selectedImage
                    }
                    alt="Image"
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              ) : (
                <div className="rounded-t-lg bg-[#e5e7eb] flex justify-center items-center w-full h-[200px] text-center">
                  No Image Uploaded
                </div>
              )}
              <div
                className={`rounded-b-lg py-4 flex justify-center flex-col items-center bg-[#fff] ${
                  isDragging ? "bg-red-200" : ""
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex items-center pb-4 gap-2">
                  <div>
                    <input
                      type="file"
                      name=""
                      className="hidden"
                      id="upload-file"
                      onChange={(e) => {
                        const file = e.target.files?.[0]; // Get the selected file
                        setSelectedImage(file);
                      }}
                    />
                    <label
                      htmlFor="upload-file"
                      className="px-3 py-2 bg-[#fff] shadow-lg rounded cursor-pointer"
                    >
                      <i className="bi bi-cloud-upload text-xl" />
                    </label>
                  </div>
                  <button
                    onClick={() => setSelectedImage(undefined)}
                    className="rounded px-2 py-1 bg-[#FF0000]"
                  >
                    <i className="bi bi-trash text-white text-xl" />
                  </button>
                  <button
                    onClick={() => {
                      setIsCameraOn(true);
                      getVideo();
                    }}
                    className="rounded px-2 py-1 bg-[#0000FF]"
                  >
                    <i className="bi bi-camera text-white text-xl" />
                  </button>
                </div>
                {isCameraOn && (
                  <div>
                    <video ref={videoRef}></video>
                    <div className="flex gap-4 justify-center items-center my-4">
                      <button
                        onClick={takePhoto}
                        className="bg-[#7f56d9] text-white p-3 rounded"
                      >
                        Capture
                      </button>
                      <button
                        className="bg-[#7f56d9] text-white p-3 rounded"
                        onClick={() => {
                          setIsCameraOn(false);
                          videoRef.current?.srcObject
                            ?.getTracks()
                            .forEach(function (track: any) {
                              track.stop();
                            });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="hidden">
                  <canvas ref={photoRef}></canvas>
                </div>
                <strong className="text-[#8564d0]">Click or Drag-n-Drop</strong>
                <small className="text-[#6e7887] mt-3">
                  PNG, JPG or GIF, Up-to 2048 x 2048 px
                </small>
              </div>
              <div className="w-full mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full rounded-lg bg-[#fff] border-2 py-2"
                >
                  Generate
                </button>
              </div>
              <div className="w-full mt-4">
                <button
                  disabled={loading}
                  onClick={handleDownload}
                  className="w-full rounded-lg  text-[#fff] hover:bg-[#8564D0] transition bg-[#000] border-2 py-2"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-2/3">
          {result && (
            <div className="w-full">
              <video className="w-full" controls src={result} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
