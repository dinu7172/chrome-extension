import { BiLogIn } from "react-icons/bi";

export default function Profile({authData}: any) {
  console.log("AuthData:- ", authData)
  const handleRedirect = () => {
    window.open("http://localhost:2000/login?by=extension", "_blank", "noopener,noreferrer");
  };
  return (
    <div className="overflow-auto scrollbar-none ">
      <div className="w-full">
        {authData?.isAuth ? (
          <div className="bg-white p-4 my-2 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              {authData?.data?.image ? (
                <img
                  src={authData.data.image}
                  alt={authData.data.userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-black dark:text-white text-sm">
                    {authData.data.userName?.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-black font-medium">
                  {authData.data.userName}
                </h3>
                <p className="text-gray-700 text-sm">{authData.data.email}</p>
                <p className="text-gray-700 text-sm">
                  Joined{" "}
                  {new Date(authData.data.joinOn).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Join Date:</span>
              <span className="text-white">
                {new Date(authData.data.joinOn).toLocaleDateString()}
              </span>
            </div>
          </div> */}
          </div>
        ) : (
          <div className="my-4">
            <button
              type="button"
              onClick={handleRedirect}
              className="w-full bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <BiLogIn className="w-4 h-4" />
                <span>Login or Sign Up</span>
              </div>
            </button>
          </div>
        )}
      </div>
      <div>
        <p>More</p>
        <div>
          <div className="w-full max-w-md p-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-8 dark:bg-gray-800 dark:border-gray-700">
            <div className="flow-root">
              <ul
                role="list"
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                <li className="py-3 sm:py-4">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <img
                        className="w-8 h-8 rounded-full"
                        src="/docs/images/people/profile-picture-1.jpg"
                        alt="Neil image"
                      />
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        Neil Sims
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        email@windster.com
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                      $320
                    </div>
                  </div>
                </li>
                <li className="py-3 sm:py-4">
                  <div className="flex items-center ">
                    <div className="shrink-0">
                      <img
                        className="w-8 h-8 rounded-full"
                        src="/docs/images/people/profile-picture-3.jpg"
                        alt="Bonnie image"
                      />
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        Bonnie Green
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        email@windster.com
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                      $3467
                    </div>
                  </div>
                </li>
                <li className="py-3 sm:py-4">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <img
                        className="w-8 h-8 rounded-full"
                        src="/docs/images/people/profile-picture-2.jpg"
                        alt="Michael image"
                      />
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        Michael Gough
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        email@windster.com
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                      $67
                    </div>
                  </div>
                </li>
                <li className="py-3 sm:py-4">
                  <div className="flex items-center ">
                    <div className="shrink-0">
                      <img
                        className="w-8 h-8 rounded-full"
                        src="/docs/images/people/profile-picture-4.jpg"
                        alt="Lana image"
                      />
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        Lana Byrd
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        email@windster.com
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                      $367
                    </div>
                  </div>
                </li>
                <li className="pt-3 pb-0 sm:pt-4">
                  <div className="flex items-center ">
                    <div className="shrink-0">
                      <img
                        className="w-8 h-8 rounded-full"
                        src="/docs/images/people/profile-picture-5.jpg"
                        alt="Thomas image"
                      />
                    </div>
                    <div className="flex-1 min-w-0 ms-4">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        Thomes Lean
                      </p>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                        email@windster.com
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                      $2367
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
