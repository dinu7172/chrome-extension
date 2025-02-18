import HomePage from '@/contentComponent/homePage';
import Profile from '@/contentComponent/profile';
import { RxCross1 } from 'react-icons/rx';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import logo from "../assets/logo.svg";
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

  useEffect(() => {
    console.log("isShowMainPopup:- ", isShowMainPopup)
},[isShowMainPopup]);

  return (
    <>
      {
        isShowMainPopup ? (
          loading ? (<FullPageLoading />): (
          <div className="fixed w-[400px] block z-[99999] h-[98%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden"
            style={{zIndex: 99999}}
          >
            <MemoryRouter>
              <Header setIsShowMainPopup={setIsShowMainPopup} setMouseHovering={setMouseHovering} authData={authData}/>
              <div className="px-4 flex flex-col" style={{ height: "calc(100vh - 150px)", backgroundColor:"#ECF1F1" }}>
                <Routes>
                  <Route path="/" element={<HomePage setIsShowMainPopup={setIsShowMainPopup} setMouseHovering={setMouseHovering} />} />
                  <Route path="/profile" element={<Profile authData={authData}/>} />
                  {/* Catch-all route for unmatched paths */}
                  {/* <Route path="*" element={<NotFoundPage />} /> */}
                </Routes>
              </div>
            </MemoryRouter>
          </div>
          )
        ) 
: 
        (
          <div
            className="fixed cursor-pointer p-2 pr-1 flex gap-2 items-center right-0 top-[15%] text-slate-300 rounded-tl-xl rounded-bl-xl"
            style={{zIndex: 99999, backgroundColor: "black"}}
            onClick={() => setIsShowMainPopup(true)}
            onMouseOver={() => setMouseHovering(true)}
            onMouseLeave={() => setMouseHovering(false)}
          >
            <div className="border-r-[1px] pr-2 h-[15px]">
              <img src={logo} alt="coupono-logo" height={30} width={65} className='object-cover'/>
            </div>
            {mouseHovering && (
              <>
                <div className="text-base font-bold text-white">
                  5 Coupons Found!
                </div>
                <div className="ring-1 rounded-full hover:ring-2 ring-indigo-50 hover:ring-red-500 hover:bg-white p-2">
                  <RxCross1 className="text-[15px]" />
                </div>
              </>
            )}
          </div>
        )
      }
    </>
  );
}


