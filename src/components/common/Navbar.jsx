import React, { useEffect, useState } from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { BiDownArrow } from "react-icons/bi";
import { useSelector } from "react-redux";
import { Link, matchPath, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { toCatalogSlug } from "../../utils/catalog";
import CategoryIcon from "./CategoryIcon";
import { NavbarLinks } from "../../data/navbar-links";
import { ProfileDropDown } from "../core/Auth/ProfileDropDown";
import { categories } from "../../services/apis";
import { apiConnector } from "../../services/apiconnector";
import { ACCOUNT_TYPE } from "../../utils/constants";

const subLinks = [
  {
    title: "python",
    link: "/catalog/python",
  },
  {
    title: "web dev",
    link: "/catalog/web-development",
  },
];

export const Navbar = () => {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const { totalItems } = useSelector((state) => state.cart);

  const location = useLocation();

  const [subLinks, setSubLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiConnector("GET", categories.CATEGORIES_API);
        setSubLinks(res.data.data);
      } catch (error) {
        console.log("Could not fetch Categories.", error);
      }
      setLoading(false);
    })();
  }, []);

  const matchRoute = (route) => {
    return matchPath({ path: route }, location.pathname);
  };
  return (
    <div className="flex h-14 items-center justify-center border-b-[1px] border-b-richblack-700">
      <div className="flex w-11/12 max-w-maxContent items-center justify-between">
        <Link to="/">
          <Logo width={160} height={42} loading="lazy" />
        </Link>

        {/* Nav Links */}
        <nav>
          <ul className="flex gap-x-6 text-richblack-25">
            {NavbarLinks.map((link, index) => (
              <li key={index}>
                {link.title === "Catalog" ? (
                  <div className="relative flex items-center gap-2 group">
                    <p>{link.title}</p>
                    <BiDownArrow />

                    <div className="invisible absolute left-[50%] top-[50%] z-[1000] flex w-[200px] translate-x-[-50%] translate-y-[3em] flex-col rounded-lg border border-richblack-700 bg-richblack-800 p-4 text-richblack-5 shadow-lg opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-[1.65em] group-hover:opacity-100 lg:w-[300px]">
                      <div className="absolute left-[50%] top-0 -z-10 h-6 w-6 translate-x-[80%] translate-y-[-40%] rotate-45 select-none rounded bg-richblack-800"></div>

                      {loading ? (
                        <p className="text-center">Loading...</p>
                      ) : subLinks && subLinks.length ? (
                        <>
                          {subLinks
                            // ?.filter((subLink) => subLink?.courses?.length > 0)
                            ?.map((subLink, i) => (
                              <Link
                                to={`/catalog/${toCatalogSlug(subLink.name)}`}
                                className="rounded-lg bg-transparent py-4 pl-4 hover:bg-richblack-700"
                                key={i}
                              >
                                <p className="flex items-center gap-3">
                                  <CategoryIcon name={subLink.name} className="shrink-0 text-accent" />
                                  {subLink.name}
                                </p>
                              </Link>
                            ))}
                        </>
                      ) : (
                        <p className="text-center">No Courses Found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Link to={link?.path}>
                    <p
                      className={`${matchRoute(link.path)
                          ? "text-accent"
                          : "text-richblack-25"
                        }`}
                    >
                      {link.title}
                    </p>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Login/Signup/Dashboard Button */}
        {/* The account menu shows at every width (it carries the cart and dashboard links on phones); the rest is md+. */}
        <div className="flex items-center gap-x-4">
          {user && user?.accountType !== ACCOUNT_TYPE.INSTRUCTOR && (                  // if user is present(login) and user is not instructor then we show cart icon in place of login and signup;
            <Link to="/dashboard/cart" className="relative hidden md:block">
              <AiOutlineShoppingCart className="text-2xl text-richblack-100" />          {/* icon of cart */}
              {totalItems > 0 && (<span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center overflow-hidden rounded-full bg-richblack-600 text-center text-xs font-bold text-accent">
                {totalItems}                                      {/* no of item(courses) present in cart , we take it absolute because we want to overlap it over cart icon */}
              </span>
              )
              }
            </Link>
          )
          }
          {token === null && (
            <Link to="/login" className="hidden md:block">
              <button
                className="border border-richblack-700 bg-richblack-800 px-[12px] py-[8px]
                                text-richblack-100 rounded-md"
              >
                Log in
              </button>
            </Link>
          )}
          {token === null && (
            <Link to="/signup" className="hidden md:block">
              <button
                className="border border-richblack-700 bg-richblack-800 px-[12px] py-[8px]
                                text-richblack-100 rounded-md"
              >
                Sign up
              </button>
            </Link>
          )}
          {token !== null && <ProfileDropDown />}
        </div>
      </div>
    </div>
  );
};
