import HomePage from '@/contentComponent/homePage';
import Profile from '@/contentComponent/profile';
import { RxCross1 } from 'react-icons/rx';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import logo from "../../assets/logo.png";
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
        !loading && (
          loading ? (<FullPageLoading />): (
          <div className="w-[400px] h-[600px] rounded-2xl overflow-hidden">
            <MemoryRouter>
              <Header setIsShowMainPopup={setIsShowMainPopup} setMouseHovering={setMouseHovering} />
              <div className="bg-slate-800 p-4 flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
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
        ) 
    
      }
    </>
  );
}


