import HomePage from '@/contentComponent/homePage';
import Profile from '@/contentComponent/profile';
import { RxCross1 } from 'react-icons/rx';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import logo from "../assets/logo.png";
import Header from '@/contentComponent/header';
import FullPageLoading from '@/contentComponent/fullPageLoading';


export default function App() {
  const [isShowMainPopup, setIsShowMainPopup] = useState(false);
  const [mouseHovering, setMouseHovering] = useState(false);
  const [authData, setAuthData] = useState<null>(null);
  const [loading , setLoading] = useState(true);

  const fetchAuth = useCallback(async () => {
     await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_AUTH" }, (response) => {
        resolve(setAuthData(response));
        setLoading(false)
      });
    });
  } ,[])

  useEffect(() => {
       fetchAuth();
  },[]);

  return (
    <>
      {
        isShowMainPopup ? (
          loading ? (<FullPageLoading />): (
          <div className="fixed w-[400px] block z-[9999] h-[90%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden">
            <MemoryRouter>
              <Header setIsShowMainPopup={setIsShowMainPopup} setMouseHovering={setMouseHovering} />
              <div className="bg-slate-800 p-4 flex flex-col" style={{ height: "calc(100vh - 150px)" }}>
                <Routes>
                  <Route path="/" element={<HomePage setIsShowMainPopup={setIsShowMainPopup} setMouseHovering={setMouseHovering} />} />
                  <Route path="/profile" element={<Profile />} />
                  {/* Catch-all route for unmatched paths */}
                  {/* <Route path="*" element={<NotFoundPage />} /> */}
                </Routes>
              </div>
            </MemoryRouter>
          </div>
          )
        ) : (
          <div
            className="fixed z-[999999] cursor-pointer p-5 pr-1 flex gap-2 items-center right-0 top-[15%] bg-gray-800 text-slate-300 rounded-tl-xl rounded-bl-xl"
            onClick={() => setIsShowMainPopup(true)}
            onMouseOver={() => setMouseHovering(true)}
            onMouseLeave={() => setMouseHovering(false)}
          >
            <div className="border-r-[1px] pr-2">
              <img src={logo} alt="coupono-logo" width={50} />
            </div>
            {mouseHovering && (
              <>
                <div className="text-xl font-bold">
                  5 Coupons Found!
                </div>
                <div className="ring-1 rounded-full hover:ring-2 ring-red-500 hover:ring-indigo-50 hover:bg-red-600 p-2">
                  <RxCross1 className="text-[20px]" />
                </div>
              </>
            )}
          </div>
        )
      }
    </>
  );
}


